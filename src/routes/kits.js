/**
 * routes/kits.js — RESTful API cho Hộp Kit
 *
 * THỨ TỰ ROUTE QUAN TRỌNG — Routes cụ thể PHẢI đặt TRƯỚC routes có tham số (:id)
 *
 * GET    /api/kits                — Lấy danh sách hộp kit
 * GET    /api/kits/qr/:token      — [QR SCAN] Tra cứu kit bằng QR Token cố định
 * POST   /api/kits/migrate-tokens — [ADMIN] Sinh qrToken cho tất cả kit cũ
 * GET    /api/kits/:id            — Lấy chi tiết 1 hộp kit
 * POST   /api/kits                — Tạo hộp kit mới (tự sinh qrToken)
 * PUT    /api/kits/:id            — Cập nhật hộp kit (KHÔNG đổi qrToken)
 * DELETE /api/kits/:id            — Xóa hộp kit
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // Built-in Node.js — không cần cài package
const Kit = require('../models/Kit');
const AuditLog = require('../models/AuditLog');
const { assignCodesToComponents } = require('../utils/componentCode');

// ─── GET /api/kits — Lấy danh sách tất cả hộp kit ───────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const kits = await Kit.find().sort({ createdAt: -1 });
    res.json({ success: true, count: kits.length, data: kits });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/kits/qr/:token — Tra cứu kit bằng QR Token ────────────────────
// ⚠️ PHẢI đặt TRƯỚC /:id — nếu không Express sẽ nhầm "qr" là một _id
router.get('/qr/:token', async (req, res, next) => {
  try {
    const kit = await Kit.findOne({ qrToken: req.params.token });
    if (!kit) {
      res.status(404);
      throw new Error('Không tìm thấy hộp kit với mã QR này.');
    }
    res.json({ success: true, data: kit });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/kits/migrate-tokens — Sinh qrToken cho kit cũ chưa có ────────
// Gọi 1 lần từ trình duyệt: POST https://air-manager-api.onrender.com/api/kits/migrate-tokens
router.post('/migrate-tokens', async (req, res, next) => {
  try {
    const kitsWithoutToken = await Kit.find({
      $or: [
        { qrToken: { $exists: false } },
        { qrToken: null },
        { qrToken: '' },
      ]
    });

    if (kitsWithoutToken.length === 0) {
      return res.json({
        success: true,
        message: 'Tất cả hộp kit đã có qrToken. Không cần migration.',
        updated: 0,
      });
    }

    const results = [];
    for (const kit of kitsWithoutToken) {
      kit.qrToken = crypto.randomUUID();
      await kit.save();
      results.push({ name: kit.name, qrToken: kit.qrToken });
    }

    res.json({
      success: true,
      message: `Đã sinh qrToken cho ${results.length} hộp kit thành công!`,
      updated: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/kits/:id — Lấy chi tiết 1 hộp kit ─────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const kit = await Kit.findById(req.params.id);
    if (!kit) {
      res.status(404);
      throw new Error('Không tìm thấy hộp kit');
    }
    res.json({ success: true, data: kit });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/kits — Tạo hộp kit mới (tự sinh qrToken cố định) ─────────────
router.post('/', async (req, res, next) => {
  try {
    const { name, topic, status, components, operator } = req.body;

    const kit = new Kit({
      name,
      topic,
      status: status || 'Sẵn sàng',
      qrToken: crypto.randomUUID(), // Sinh 1 lần, không bao giờ thay đổi
      components: assignCodesToComponents(components || []),
    });

    const saved = await kit.save();

    const log = new AuditLog({
      actionType: 'CREATE_KIT',
      targetType: 'KIT',
      targetId: saved._id.toString(),
      description: `Đã tạo mới hộp kit "${saved.name}" (chủ đề: ${saved.topic}) — QR: ${saved.qrToken}`,
      operator: operator || 'Quản trị viên',
      details: saved
    });
    await log.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      error.message = 'Tên hộp kit này đã tồn tại trên hệ thống';
    }
    next(error);
  }
});

// ─── PUT /api/kits/:id — Cập nhật hộp kit (KHÔNG đổi qrToken) ───────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { name, topic, status, components, operator } = req.body;

    const kit = await Kit.findById(req.params.id);
    if (!kit) {
      res.status(404);
      throw new Error('Không tìm thấy hộp kit để chỉnh sửa');
    }

    const oldSnapshot = JSON.parse(JSON.stringify(kit));

    if (name !== undefined) kit.name = name;
    if (topic !== undefined) kit.topic = topic;
    if (status !== undefined) kit.status = status;
    if (components !== undefined) kit.components = assignCodesToComponents(components);
    // qrToken KHÔNG được thay đổi ở đây

    const updated = await kit.save();

    let actionType = 'UPDATE_KIT';
    let changeDesc = `Đã cập nhật thông tin hộp kit "${updated.name}"`;
    if (components !== undefined) {
      actionType = 'UPDATE_COMPONENTS';
      changeDesc = `Đã cập nhật danh sách linh kiện của hộp kit "${updated.name}" (${updated.components.length} linh kiện)`;
    }

    const log = new AuditLog({
      actionType,
      targetType: 'KIT',
      targetId: updated._id.toString(),
      description: changeDesc,
      operator: operator || 'Quản trị viên',
      details: { before: oldSnapshot, after: updated }
    });
    await log.save();

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/kits/:id — Xóa hộp kit ─────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { operator } = req.query;
    const kit = await Kit.findById(req.params.id);
    if (!kit) {
      res.status(404);
      throw new Error('Không tìm thấy hộp kit để xóa');
    }

    await Kit.findByIdAndDelete(req.params.id);

    const log = new AuditLog({
      actionType: 'DELETE_KIT',
      targetType: 'KIT',
      targetId: kit._id.toString(),
      description: `Đã xóa hộp kit "${kit.name}" (chủ đề: ${kit.topic}). Dữ liệu đã lưu vào nhật ký.`,
      operator: operator || 'Quản trị viên',
      details: kit
    });
    await log.save();

    res.json({
      success: true,
      message: `Đã xóa hộp kit "${kit.name}" thành công.`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

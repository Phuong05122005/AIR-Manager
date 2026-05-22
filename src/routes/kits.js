/**
 * routes/kits.js — RESTful API cho Hộp Kit
 * GET    /api/kits            — Lấy danh sách hộp kit
 * GET    /api/kits/:id        — Lấy chi tiết 1 hộp kit
 * GET    /api/kits/qr/:token  — Tra cứu hộp kit bằng QR Token cố định [DÙNG ĐỂ QUÉT QR]
 * POST   /api/kits            — Tạo hộp kit mới (tự sinh qrToken, lưu log CREATE_KIT)
 * PUT    /api/kits/:id        — Cập nhật hộp kit / linh kiện (KHÔNG đổi qrToken)
 * DELETE /api/kits/:id        — Xóa hộp kit (lưu log DELETE_KIT kèm snapshot)
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto'); // Built-in Node.js — sinh UUID không cần cài package
const Kit = require('../models/Kit');
const AuditLog = require('../models/AuditLog');
const { assignCodesToComponents } = require('../utils/componentCode');

// ─── GET /api/kits — Lấy danh sách tất cả hộp kit ────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const kits = await Kit.find().sort({ createdAt: -1 });
    res.json({ success: true, count: kits.length, data: kits });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/kits/:id — Lấy chi tiết 1 hộp kit ────────────────────────────────
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

// ─── GET /api/kits/qr/:token — Tra cứu hộp kit bằng QR Token (DÙNG KHI QUÉT QR) ──
// ⚠️ PHẢI đặt TRƯỚC /:id để tránh bị match nhầm sang GET /:id
router.get('/qr/:token', async (req, res, next) => {
  try {
    const kit = await Kit.findOne({ qrToken: req.params.token });
    if (!kit) {
      res.status(404);
      throw new Error('Không tìm thấy hộp kit với mã QR này. Mã có thể không hợp lệ.');
    }
    res.json({ success: true, data: kit });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/kits — Tạo hộp kit mới (tự sinh qrToken) ─────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { name, topic, status, components, operator } = req.body;

    const kit = new Kit({
      name,
      topic,
      status: status || 'Sẵn sàng',
      // ─── QR Token cố định: sinh 1 lần, không bao giờ thay đổi ─────────────
      qrToken: crypto.randomUUID(),
      components: assignCodesToComponents(components || []),
    });

    const saved = await kit.save();

    // Ghi Audit Log hành vi tạo mới
    const log = new AuditLog({
      actionType: 'CREATE_KIT',
      targetType: 'KIT',
      targetId: saved._id.toString(),
      description: `Đã tạo mới hộp kit "${saved.name}" (chủ đề: ${saved.topic}) — QR Token: ${saved.qrToken}`,
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

// ─── PUT /api/kits/:id — Cập nhật hộp kit / linh kiện trong hộp kit ─────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { name, topic, status, components, operator } = req.body;
    
    const kit = await Kit.findById(req.params.id);
    if (!kit) {
      res.status(404);
      throw new Error('Không tìm thấy hộp kit để chỉnh sửa');
    }

    // Lưu lại dữ liệu snapshot cũ trước khi chỉnh sửa
    const oldSnapshot = JSON.parse(JSON.stringify(kit));

    // Cập nhật thông tin mới
    if (name !== undefined) kit.name = name;
    if (topic !== undefined) kit.topic = topic;
    if (status !== undefined) kit.status = status;
    if (components !== undefined) kit.components = assignCodesToComponents(components);

    const updated = await kit.save();

    // Xác định loại thao tác ghi nhật ký
    let actionType = 'UPDATE_KIT';
    let changeDesc = `Đã cập nhật thông tin hộp kit "${updated.name}"`;
    
    // Nếu có sự thay đổi về danh sách linh kiện trong hộp
    if (components !== undefined) {
      actionType = 'UPDATE_COMPONENTS';
      changeDesc = `Đã cập nhật danh sách linh kiện của hộp kit "${updated.name}" (Số lượng: ${updated.components.length} linh kiện)`;
    }

    // Ghi Audit Log hành vi cập nhật kèm snapshot trước/sau
    const log = new AuditLog({
      actionType,
      targetType: 'KIT',
      targetId: updated._id.toString(),
      description: changeDesc,
      operator: operator || 'Quản trị viên',
      details: {
        before: oldSnapshot,
        after: updated
      }
    });
    await log.save();

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/kits/:id — Xóa hộp kit (LƯU LẠI SNAPSHOT PHỤC VỤ TRUY VẤN LỊCH SỬ) ─
router.delete('/:id', async (req, res, next) => {
  try {
    const { operator } = req.query;
    const kit = await Kit.findById(req.params.id);
    if (!kit) {
      res.status(404);
      throw new Error('Không tìm thấy hộp kit để xóa');
    }

    // Xóa hộp kit khỏi collection chính
    await Kit.findByIdAndDelete(req.params.id);

    // Ghi Audit Log hành vi Xóa kèm theo TOÀN BỘ snapshot dữ liệu hộp kit (để không bị mất dữ liệu)
    const log = new AuditLog({
      actionType: 'DELETE_KIT',
      targetType: 'KIT',
      targetId: kit._id.toString(),
      description: `Đã xóa hộp kit "${kit.name}" (chủ đề: ${kit.topic}). Toàn bộ danh sách linh kiện đã được lưu trữ trong nhật ký hệ thống.`,
      operator: operator || 'Quản trị viên',
      details: kit // Chứa đầy đủ danh sách linh kiện cũ của hộp kit bị xóa!
    });
    await log.save();

    res.json({ 
      success: true, 
      message: `Đã xóa hộp kit "${kit.name}" thành công và sao lưu dữ liệu vào nhật ký hệ thống.` 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

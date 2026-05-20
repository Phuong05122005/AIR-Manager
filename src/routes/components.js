/**
 * routes/components.js — RESTful API cho Linh kiện
 * GET    /api/components          — Lấy danh sách
 * GET    /api/components/stats    — Thống kê tổng quan
 * GET    /api/components/:id      — Lấy chi tiết 1 linh kiện
 * POST   /api/components          — Tạo mới
 * PUT    /api/components/:id      — Cập nhật
 * DELETE /api/components/:id      — Xóa
 */

const express = require('express');
const router = express.Router();
const Component = require('../models/Component');

// ─── GET /api/components/stats — Thống kê tổng quan (Dashboard) ───────────────
router.get('/stats', async (req, res, next) => {
  try {
    const total = await Component.countDocuments();
    const available = await Component.countDocuments({ status: 'available' });
    const lowStock = await Component.countDocuments({ status: 'low_stock' });
    const outOfStock = await Component.countDocuments({ status: 'out_of_stock' });

    // Tổng số lượng tất cả linh kiện
    const totalQuantityResult = await Component.aggregate([
      { $group: { _id: null, total: { $sum: '$totalQuantity' } } },
    ]);
    const totalQuantity = totalQuantityResult[0]?.total || 0;

    res.json({
      success: true,
      data: { total, available, lowStock, outOfStock, totalQuantity },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/components — Lấy danh sách (có hỗ trợ search & filter) ──────────
router.get('/', async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const query = {};

    // Tìm kiếm theo tên hoặc mã
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const components = await Component.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: components.length, data: components });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/components/:id — Lấy 1 linh kiện ───────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      res.status(404);
      throw new Error('Không tìm thấy linh kiện');
    }
    res.json({ success: true, data: component });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/components — Tạo mới linh kiện ────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { name, code, category, totalQuantity, location, description, imageUrl } = req.body;

    const component = new Component({
      name,
      code,
      category,
      totalQuantity,
      availableQuantity: totalQuantity, // Ban đầu toàn bộ đều khả dụng
      location,
      description,
      imageUrl,
    });

    const saved = await component.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    // Lỗi trùng mã linh kiện
    if (error.code === 11000) {
      res.status(400);
      error.message = 'Mã linh kiện đã tồn tại';
    }
    next(error);
  }
});

// ─── PUT /api/components/:id — Cập nhật linh kiện ────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id);
    if (!component) {
      res.status(404);
      throw new Error('Không tìm thấy linh kiện');
    }

    // Cập nhật các trường được gửi lên
    Object.assign(component, req.body);
    const updated = await component.save(); // Trigger pre-save hook cập nhật status

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/components/:id — Xóa linh kiện ──────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const component = await Component.findByIdAndDelete(req.params.id);
    if (!component) {
      res.status(404);
      throw new Error('Không tìm thấy linh kiện');
    }
    res.json({ success: true, message: 'Đã xóa linh kiện thành công' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

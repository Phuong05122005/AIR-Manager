/**
 * routes/logs.js — RESTful API cho Nhật ký hệ thống / Lịch sử thao tác
 * GET /api/logs — Lấy danh sách nhật ký hệ thống
 */

const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// GET /api/logs — Lấy toàn bộ nhật ký sắp xếp mới nhất lên đầu
router.get('/', async (req, res, next) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

/**
 * routes/borrows.js — RESTful API cho Mượn/Trả Hộp Kit
 */

const express = require('express');
const router = express.Router();
const BorrowRecord = require('../models/BorrowRecord');
const Kit = require('../models/Kit');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// GET /api/borrows — Lấy toàn bộ lịch sử mượn/trả Hộp Kit
router.get('/', async (req, res, next) => {
  try {
    const { status, userId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;

    const records = await BorrowRecord.find(query)
      .populate('user', 'name studentId email')
      .populate('kit', 'name topic status components')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    next(error);
  }
});

// POST /api/borrows — Tạo phiếu mượn Hộp Kit mới
router.post('/', async (req, res, next) => {
  try {
    const { userId, kitId, dueDate, note } = req.body;

    // Kiểm tra Hộp Kit tồn tại và sẵn sàng không
    const kit = await Kit.findById(kitId);
    if (!kit) {
      res.status(404);
      throw new Error('Không tìm thấy Hộp Kit');
    }
    if (kit.status === 'Đang mượn') {
      res.status(400);
      throw new Error('Hộp Kit này đang được mượn rồi');
    }

    // Kiểm tra người dùng tồn tại
    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('Không tìm thấy người dùng');
    }

    // Tạo bản ghi mượn
    const record = new BorrowRecord({
      user: userId,
      kit: kitId,
      quantity: 1, // Mượn nguyên hộp kit
      dueDate,
      note,
    });
    await record.save();

    // Ghi Audit Log hành vi mượn Hộp Kit
    const log = new AuditLog({
      actionType: 'BORROW',
      targetType: 'BORROW',
      targetId: record._id.toString(),
      description: `Đã mượn Hộp Kit "${kit.name}" bởi SV ${user.name} (${user.studentId})`,
      operator: user.name,
      details: record
    });
    await log.save();

    // Chuyển trạng thái Hộp Kit sang Đang mượn
    kit.status = 'Đang mượn';
    await kit.save();

    // Tăng tổng số lần mượn của user
    await User.findByIdAndUpdate(userId, { $inc: { totalBorrows: 1 } });

    // Populate để trả về dữ liệu đầy đủ
    const populated = await BorrowRecord.findById(record._id)
      .populate('user', 'name studentId')
      .populate('kit', 'name topic components');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
});

// PUT /api/borrows/:id/return — Trả Hộp Kit
router.put('/:id/return', async (req, res, next) => {
  try {
    const record = await BorrowRecord.findById(req.params.id);
    if (!record) {
      res.status(404);
      throw new Error('Không tìm thấy phiếu mượn');
    }
    if (record.status === 'returned') {
      res.status(400);
      throw new Error('Hộp Kit này đã được trả rồi');
    }

    // Cập nhật trạng thái phiếu mượn
    record.status = 'returned';
    record.returnDate = new Date();
    await record.save();

    // Hoàn trả trạng thái Hộp Kit thành Sẵn sàng
    const kit = await Kit.findById(record.kit);
    if (kit) {
      kit.status = 'Sẵn sàng';
      await kit.save();
    }

    // Ghi Audit Log hành vi trả Hộp Kit
    const usr = await User.findById(record.user);
    const log = new AuditLog({
      actionType: 'RETURN',
      targetType: 'BORROW',
      targetId: record._id.toString(),
      description: `Đã hoàn trả Hộp Kit "${kit ? kit.name : 'Hộp Kit'}" bởi SV ${usr ? usr.name : 'Chưa rõ'} (${usr ? usr.studentId : '—'})`,
      operator: usr ? usr.name : 'Sinh viên',
      details: record
    });
    await log.save();

    res.json({ success: true, message: 'Trả Hộp Kit thành công', data: record });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

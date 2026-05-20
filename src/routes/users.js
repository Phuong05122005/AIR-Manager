/**
 * routes/users.js — RESTful API cho Người dùng
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// GET /api/users — Lấy danh sách người dùng
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().select('-__v').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id — Lấy 1 người dùng
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('Không tìm thấy người dùng');
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// POST /api/users — Tạo người dùng mới
router.post('/', async (req, res, next) => {
  try {
    const user = new User(req.body);
    const saved = await user.save();
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400);
      error.message = 'Mã sinh viên hoặc email đã tồn tại';
    }
    next(error);
  }
});

// PUT /api/users/:id — Cập nhật người dùng
router.put('/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      res.status(404);
      throw new Error('Không tìm thấy người dùng');
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/login — Đăng nhập người dùng hoặc Admin
router.post('/login', async (req, res, next) => {
  try {
    const { studentId, password, role } = req.body;

    if (!studentId || !password) {
      res.status(400);
      throw new Error('Vui lòng điền đầy đủ tài khoản và mật khẩu');
    }

    // Tìm người dùng theo studentId (hoặc email)
    const user = await User.findOne({
      $or: [
        { studentId: { $regex: new RegExp(`^${studentId}$`, 'i') } },
        { email: { $regex: new RegExp(`^${studentId}$`, 'i') } }
      ]
    });

    if (!user) {
      // Ghi log đăng nhập thất bại
      const failLog = new AuditLog({
        actionType: 'LOGIN_FAILED',
        targetType: 'USER',
        description: `Đăng nhập thất bại — Tài khoản "${studentId}" không tồn tại`,
        operator: studentId,
        details: { studentId, role: role || 'unknown', reason: 'Tài khoản không tồn tại' }
      });
      await failLog.save();

      res.status(401);
      throw new Error('Tài khoản không tồn tại trên hệ thống');
    }

    // Xác thực vai trò nếu được truyền lên (chấp nhận cả 'user' và 'student' đại diện cho Sinh viên)
    const checkRole = (role === 'user') ? 'student' : role;
    if (checkRole && user.role !== checkRole) {
      // Ghi log đăng nhập sai vai trò
      const roleFailLog = new AuditLog({
        actionType: 'LOGIN_FAILED',
        targetType: 'USER',
        targetId: user._id.toString(),
        description: `Đăng nhập thất bại — ${user.name} (${user.studentId}) chọn sai vai trò "${role}"`,
        operator: user.name,
        details: { studentId: user.studentId, expectedRole: user.role, selectedRole: role }
      });
      await roleFailLog.save();

      res.status(403);
      throw new Error('Vai trò tài khoản không phù hợp');
    }

    // Kiểm tra mật khẩu (so sánh plain-text trực tiếp theo yêu cầu phát triển)
    if (user.password !== password) {
      // Ghi log đăng nhập sai mật khẩu
      const pwFailLog = new AuditLog({
        actionType: 'LOGIN_FAILED',
        targetType: 'USER',
        targetId: user._id.toString(),
        description: `Đăng nhập thất bại — ${user.name} (${user.studentId}) nhập sai mật khẩu`,
        operator: user.name,
        details: { studentId: user.studentId, reason: 'Sai mật khẩu' }
      });
      await pwFailLog.save();

      res.status(401);
      throw new Error('Mật khẩu không chính xác');
    }

    // ─── GHI LOG ĐĂNG NHẬP THÀNH CÔNG VÀO MONGODB ─────────────────────
    const loginLog = new AuditLog({
      actionType: 'LOGIN',
      targetType: 'USER',
      targetId: user._id.toString(),
      description: `${user.name} (${user.studentId}) đã đăng nhập thành công với vai trò ${user.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}`,
      operator: user.name,
      details: {
        userId: user._id,
        studentId: user.studentId,
        name: user.name,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString(),
      }
    });
    await loginLog.save();

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        id: user._id,
        studentId: user.studentId,
        name: user.name,
        email: user.email,
        phone: user.phone || 'Chưa cập nhật',
        department: user.department || 'Kỹ thuật Điện tử',
        role: user.role,
        avatarUrl: user.avatarUrl,
        password: user.password
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

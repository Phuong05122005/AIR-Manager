/**
 * models/User.js — Schema cho Người dùng
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên người dùng là bắt buộc'],
      trim: true,
    },
    studentId: {
      type: String,
      required: [true, 'Mã số sinh viên là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Email không hợp lệ'],
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: 'Kỹ thuật điện tử',
    },
    avatarUrl: {
      type: String,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      default: '123',
    },
    totalBorrows: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

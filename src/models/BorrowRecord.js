/**
 * models/BorrowRecord.js — Schema cho Lịch sử mượn/trả linh kiện
 */

const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Người mượn là bắt buộc'],
    },
    kit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kit',
      required: [true, 'Hộp kit là bắt buộc'],
    },
    quantity: {
      type: Number,
      required: [true, 'Số lượng mượn là bắt buộc'],
      min: [1, 'Số lượng tối thiểu là 1'],
      default: 1,
    },
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Ngày hẹn trả là bắt buộc'],
    },
    returnDate: {
      type: Date, // null = chưa trả
    },
    status: {
      type: String,
      enum: ['borrowing', 'returned', 'overdue'],
      default: 'borrowing',
    },
    note: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: Kiểm tra xem có quá hạn không
borrowRecordSchema.virtual('isOverdue').get(function () {
  return this.status === 'borrowing' && new Date() > this.dueDate;
});

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);

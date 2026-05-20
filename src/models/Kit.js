/**
 * models/Kit.js — Schema cho Hộp Kit
 */

const mongoose = require('mongoose');

const kitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên hộp kit là bắt buộc'],
      unique: true,
      trim: true,
    },
    topic: {
      type: String,
      required: [true, 'Chủ đề dạy là bắt buộc'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Sẵn sàng', 'Đang mượn', 'Thiếu đồ'],
      default: 'Sẵn sàng',
    },
    components: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        image: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/2885/2885417.png' },
        code: { type: String, default: 'N/A' },
        quantity: { type: Number, default: 1, min: 1 },
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Kit', kitSchema);

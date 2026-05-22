/**
 * models/Kit.js — Schema cho Hộp Kit
 *
 * qrToken: UUID cố định, duy nhất cho mỗi hộp kit.
 *          Được sinh tự động khi tạo kit mới và KHÔNG BAO GIỜ thay đổi.
 *          Mã QR in ra luôn hợp lệ kể cả khi đổi tên/linh kiện.
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
    // ─── QR Token Cố Định ─────────────────────────────────────────────────────
    // UUID v4, sinh 1 lần khi tạo kit, không thay đổi bao giờ.
    // Dùng để định danh kit khi quét QR code.
    qrToken: {
      type: String,
      unique: true,
      sparse: true, // Cho phép null trong kit cũ (trước khi migration)
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

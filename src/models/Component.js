/**
 * models/Component.js — Schema cho Linh kiện / Thiết bị
 */

const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên linh kiện là bắt buộc'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Mã linh kiện là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Cảm biến', 'Vi điều khiển', 'Module', 'Điện trở', 'Tụ điện', 'Khác'],
      default: 'Khác',
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: [0, 'Số lượng không được âm'],
      default: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, 'Số lượng khả dụng không được âm'],
      default: 0,
    },
    location: {
      type: String,
      trim: true,
      default: 'Kho A',
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['available', 'low_stock', 'out_of_stock'],
      default: 'available',
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Hook: Tự động cập nhật status dựa trên availableQuantity trước khi lưu
componentSchema.pre('save', function (next) {
  if (this.availableQuantity === 0) {
    this.status = 'out_of_stock';
  } else if (this.availableQuantity <= this.totalQuantity * 0.2) {
    this.status = 'low_stock';
  } else {
    this.status = 'available';
  }
  next();
});

module.exports = mongoose.model('Component', componentSchema);

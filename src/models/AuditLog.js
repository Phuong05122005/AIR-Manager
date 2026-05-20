/**
 * models/AuditLog.js — Schema cho Nhật ký hệ thống / Lịch sử chỉnh sửa
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actionType: {
      type: String, // 'CREATE_KIT', 'UPDATE_KIT', 'DELETE_KIT', 'UPDATE_COMPONENTS', 'BORROW', 'RETURN'
      required: true,
    },
    targetType: {
      type: String, // 'KIT', 'COMPONENT', 'BORROW'
      required: true,
    },
    targetId: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    operator: {
      type: String,
      default: 'Hệ thống',
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Chứa bản chụp (snapshot) dữ liệu trạng thái trước/sau đổi để không lo mất dữ liệu
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

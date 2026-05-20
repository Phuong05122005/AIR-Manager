/**
 * middleware/errorHandler.js — Xử lý lỗi toàn cục
 */

const errorHandler = (err, req, res, next) => {
  console.error('❌ Lỗi server:', err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi trên server',
    // Chỉ hiển thị stack trace trong môi trường dev
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;

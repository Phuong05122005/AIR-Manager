/**
 * config/db.js — Kết nối MongoDB qua Mongoose & Tự động Seed dữ liệu
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/air_components_manager';
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB đã kết nối: ${conn.connection.host}`);

    // ─── TỰ ĐỘNG SEED DỮ LIỆU NẾU CHƯA CÓ ADMIN ────────────────────────────────────
    const User = require('../models/User');
    
    // Tự động cập nhật Admin cũ thành Nguyễn Thái Phương nếu tên vẫn là Trần Quản Trị
    await User.updateMany(
      { studentId: 'ADMIN', name: 'Trần Quản Trị' },
      { name: 'Nguyễn Thái Phương', phone: '0865898047' }
    );

    const Component = require('../models/Component');
    const Kit = require('../models/Kit');
    const AuditLog = require('../models/AuditLog');

    const hasNewStudent = await User.findOne({ studentId: '123000001' });
    if (!hasNewStudent) {
      console.log('⏳ Phát hiện chưa cập nhật mã sinh viên mẫu mới. Đang tự động nạp dữ liệu...');

      // Xóa dữ liệu cũ trong database chính
      await User.deleteMany({});
      await Component.deleteMany({});
      await Kit.deleteMany({});
      await AuditLog.deleteMany({});

      // Dữ liệu mẫu
      const SAMPLE_USERS = [
        { name: 'Nguyễn Văn An', studentId: '123000001', email: 'nguyenvanan@student.edu.vn', phone: '0901234567', department: 'Kỹ thuật Điện tử', password: '123', role: 'student' },
        { name: 'Trần Thị Bình', studentId: '123000002', email: 'tranthibinh@student.edu.vn', phone: '0912345678', department: 'Kỹ thuật Điện tử', password: '123', role: 'student' },
        { name: 'Lê Văn Cường', studentId: '123000003', email: 'levancuong@student.edu.vn', phone: '0923456789', department: 'Công nghệ thông tin', password: '123', role: 'student' },
        { name: 'Phạm Thị Dung', studentId: '123000004', email: 'phamthidung@student.edu.vn', phone: '0934567890', department: 'Cơ điện tử', password: '123', role: 'student' },
        { name: 'Nguyễn Thái Phương', studentId: 'ADMIN', email: 'admin@airobotic.edu.vn', phone: '0865898047', department: 'Quản lý', password: '123', role: 'admin' },
      ];

      const SAMPLE_COMPONENTS = [
        { name: 'Arduino Uno R3', code: 'ARD-001', category: 'Vi điều khiển', totalQuantity: 20, availableQuantity: 15, location: 'Kệ A1', description: 'Board vi điều khiển phổ biến nhất cho sinh viên' },
        { name: 'Raspberry Pi 4 Model B', code: 'RPI-001', category: 'Vi điều khiển', totalQuantity: 10, availableQuantity: 7, location: 'Kệ A1', description: 'Single-board computer mạnh mẽ' },
        { name: 'Cảm biến nhiệt độ DHT22', code: 'SEN-001', category: 'Cảm biến', totalQuantity: 50, availableQuantity: 42, location: 'Kệ B2', description: 'Đo nhiệt độ và độ ẩm' },
        { name: 'Cảm biến siêu âm HC-SR04', code: 'SEN-002', category: 'Cảm biến', totalQuantity: 30, availableQuantity: 25, location: 'Kệ B2', description: 'Đo khoảng cách' },
        { name: 'Module WiFi ESP8266', code: 'MOD-001', category: 'Module', totalQuantity: 25, availableQuantity: 2, location: 'Kệ C1', description: 'Kết nối WiFi cho IoT' },
        { name: 'Module Bluetooth HC-05', code: 'MOD-002', category: 'Module', totalQuantity: 15, availableQuantity: 12, location: 'Kệ C1', description: 'Giao tiếp Bluetooth' },
        { name: 'Điện trở 10KΩ', code: 'RES-001', category: 'Điện trở', totalQuantity: 500, availableQuantity: 450, location: 'Hộp D1', description: 'Điện trở 10KΩ 1/4W' },
        { name: 'Tụ điện 100µF', code: 'CAP-001', category: 'Tụ điện', totalQuantity: 200, availableQuantity: 0, location: 'Hộp D2', description: 'Tụ điện phân cực 100µF 16V' },
        { name: 'LED RGB 5mm', code: 'LED-001', category: 'Khác', totalQuantity: 100, availableQuantity: 88, location: 'Hộp E1', description: 'Đèn LED 3 màu RGB' },
        { name: 'Relay 5V 1 kênh', code: 'MOD-003', category: 'Module', totalQuantity: 20, availableQuantity: 14, location: 'Kệ C2', description: 'Công tắc điện relay 5V' },
      ];

      const MOCK_KITS_COMPONENTS = [
        { id: 'c1', name: 'uKit AI controller', image: 'https://cdn-icons-png.flaticon.com/512/2885/2885417.png', code: 'MC-CNBUx1' },
        { id: 'c2', name: 'Servo', image: 'https://cdn-icons-png.flaticon.com/512/2083/2083204.png', code: 'SERVOx1' },
        { id: 'c3', name: 'Square servo clip', image: 'https://cdn-icons-png.flaticon.com/512/5903/5903102.png', code: 'C3-YLWx1' },
        { id: 'c4', name: 'Turning brick', image: 'https://cdn-icons-png.flaticon.com/512/5578/5578816.png', code: 'C4-YLWx1' },
        { id: 'c5', name: 'Joint brick', image: 'https://cdn-icons-png.flaticon.com/512/2555/2555572.png', code: 'C6-YLWx10' },
        { id: 'c6', name: 'Red plug', image: 'https://cdn-icons-png.flaticon.com/512/1251/1251025.png', code: 'P48-REDx2' },
        { id: 'c7', name: 'Switch', image: 'https://cdn-icons-png.flaticon.com/512/5730/5730026.png', code: 'P117-GRYx1' },
        { id: 'c8', name: 'Servo wire', image: 'https://cdn-icons-png.flaticon.com/512/8654/8654490.png', code: 'W2-GRYx1' },
        { id: 'c9', name: 'Switch wire', image: 'https://cdn-icons-png.flaticon.com/512/10002/10002661.png', code: 'W5-BLKx1' }
      ];

      const SAMPLE_KITS = [
        { name: 'Hộp Kit #01', topic: 'Nhập môn Robotics', status: 'Sẵn sàng', components: MOCK_KITS_COMPONENTS },
        { name: 'Hộp Kit #02', topic: 'IoT Nâng cao', status: 'Đang mượn', components: MOCK_KITS_COMPONENTS.slice(0, 4) },
        { name: 'Hộp Kit #03', topic: 'Nhập môn Robotics', status: 'Sẵn sàng', components: MOCK_KITS_COMPONENTS.slice(0, 6) },
        { name: 'Hộp Kit #04', topic: 'Lập trình Python', status: 'Thiếu đồ', components: MOCK_KITS_COMPONENTS.slice(4, 8) },
      ];

      await User.insertMany(SAMPLE_USERS);
      await Component.insertMany(SAMPLE_COMPONENTS);
      await Kit.insertMany(SAMPLE_KITS);

      const systemLog = new AuditLog({
        actionType: 'SYSTEM_INIT',
        targetType: 'SYSTEM',
        description: 'Hệ thống đã được tự động nạp dữ liệu mẫu ban đầu thành công',
        operator: 'Hệ thống',
        details: { totalUsers: SAMPLE_USERS.length, totalKits: SAMPLE_KITS.length }
      });
      await systemLog.save();

      console.log('🎉 Tự động nạp dữ liệu Admin, Sinh viên và Hộp Kit mẫu thành công!');
    }

  } catch (error) {
    console.error(`❌ Lỗi kết nối hoặc khởi tạo MongoDB: ${error.message}`);
  }
};

module.exports = connectDB;

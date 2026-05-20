/**
 * seed.js — Tạo dữ liệu mẫu cho MongoDB & Dọn dẹp database không liên quan
 * Chạy: node seed.js
 */

const mongoose = require('mongoose');
const Component = require('./src/models/Component');
const User = require('./src/models/User');
const Kit = require('./src/models/Kit');
const AuditLog = require('./src/models/AuditLog');
const BorrowRecord = require('./src/models/BorrowRecord');

const MONGO_URI = 'mongodb://localhost:27017/air_components_manager';

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

const SAMPLE_USERS = [
  { name: 'Nguyễn Văn An', studentId: '123000001', email: 'nguyenvanan@student.edu.vn', phone: '0901234567', department: 'Kỹ thuật Điện tử', password: '123', role: 'student' },
  { name: 'Trần Thị Bình', studentId: '123000002', email: 'tranthibinh@student.edu.vn', phone: '0912345678', department: 'Kỹ thuật Điện tử', password: '123', role: 'student' },
  { name: 'Lê Văn Cường', studentId: '123000003', email: 'levancuong@student.edu.vn', phone: '0923456789', department: 'Công nghệ thông tin', password: '123', role: 'student' },
  { name: 'Phạm Thị Dung', studentId: '123000004', email: 'phamthidung@student.edu.vn', phone: '0934567890', department: 'Cơ điện tử', password: '123', role: 'student' },
  { name: 'Nguyễn Thái Phương', studentId: 'ADMIN', email: 'admin@airobotic.edu.vn', phone: '0865898047', department: 'Quản lý', password: '123', role: 'admin' },
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

async function seed() {
  try {
    // ─── DỌN DẸP DATABASE KHÔNG LIÊN QUAN ──────────────────────────────────────────
    console.log('🧹 Đang kiểm tra và dọn dẹp các database không liên quan...');
    try {
      const testConn = await mongoose.createConnection('mongodb://localhost:27017/test').asPromise();
      await testConn.dropDatabase();
      console.log('✅ Đã xóa database không liên quan: test');
      await testConn.close();
    } catch (e) {
      console.log('ℹ️ Không có database "test" hoặc không thể xóa: ' + e.message);
    }

    try {
      const oldConn = await mongoose.createConnection('mongodb://localhost:27017/air_manager').asPromise();
      await oldConn.dropDatabase();
      console.log('✅ Đã xóa database không liên quan: air_manager');
      await oldConn.close();
    } catch (e) {
      console.log('ℹ️ Không có database "air_manager" hoặc không thể xóa: ' + e.message);
    }

    // ─── KẾT NỐI VÀ SEED DỮ LIỆU DỰ ÁN ─────────────────────────────────────────────
    console.log(`📡 Đang kết nối MongoDB: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Đã kết nối MongoDB thành công');

    // Xóa dữ liệu cũ của dự án
    await Component.deleteMany({});
    await User.deleteMany({});
    await Kit.deleteMany({});
    await AuditLog.deleteMany({});
    await BorrowRecord.deleteMany({});
    console.log('🗑️  Đã làm sạch dữ liệu cũ trong air_components_manager');

    // Thêm dữ liệu mẫu
    const components = await Component.insertMany(SAMPLE_COMPONENTS);
    const users = await User.insertMany(SAMPLE_USERS);
    const kits = await Kit.insertMany(SAMPLE_KITS);

    console.log(`📦 Đã nạp ${components.length} linh kiện đơn lẻ mẫu`);
    console.log(`🎓 Đã nạp ${users.length} tài khoản người dùng và quản trị mẫu`);
    console.log(`📦 Đã nạp ${kits.length} Hộp Kit mẫu`);

    // Ghi log khởi tạo hệ thống
    const systemLog = new AuditLog({
      actionType: 'SYSTEM_INIT',
      targetType: 'SYSTEM',
      description: 'Hệ thống đã được nạp dữ liệu mẫu ban đầu thành công',
      operator: 'Hệ thống',
      details: {
        totalComponents: components.length,
        totalUsers: users.length,
        totalKits: kits.length
      }
    });
    await systemLog.save();
    console.log('📝 Đã ghi nhật ký khởi tạo hệ thống');

    console.log('\n🎉 Seed dữ liệu & Dọn dẹp Database hoàn tất thành công!');

  } catch (error) {
    console.error('❌ Lỗi seed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();

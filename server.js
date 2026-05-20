/**
 * server.js — Entry point cho AIR Components Manager Backend
 * Khởi động Express server, kết nối MongoDB, đăng ký routes
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

// Load biến môi trường từ file .env
dotenv.config();

// Kết nối MongoDB
connectDB();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors()); // Cho phép mobile app gọi API từ địa chỉ khác
app.use(express.json()); // Parse body JSON

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/components', require('./src/routes/components'));
app.use('/api/users',      require('./src/routes/users'));
app.use('/api/borrows',    require('./src/routes/borrows'));
app.use('/api/kits',       require('./src/routes/kits'));
app.use('/api/logs',       require('./src/routes/logs'));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🚀 AIR Components Manager API đang chạy!', status: 'OK' });
});

// ─── Global error handler ──────────────────────────────────────────────────────
app.use(require('./src/middleware/errorHandler'));

// ─── Khởi động server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const os = require('os');

const getLocalIp = () => {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
};

const localIp = getLocalIp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server đang lắng nghe tại: http://0.0.0.0:${PORT}`);
  console.log(`📡 Mobile app kết nối qua: http://${localIp}:${PORT}`);
  console.log(`💡 Hãy kiểm tra xem DEFAULT_IP trong src/api/apiClient.js đã khớp với IP này chưa: ${localIp}`);
});

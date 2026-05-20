# 🚀 AIR Components Manager — Hướng dẫn khởi chạy

## Yêu cầu hệ thống
- Node.js >= 18.x
- MongoDB (cài + chạy local qua MongoDB Compass)
- Expo Go app trên điện thoại (tải từ App Store / Play Store)
- Điện thoại và máy tính phải **cùng WiFi**

---

## BƯỚC 1 — Khởi động MongoDB

Mở **MongoDB Compass** và kết nối tới:
```
mongodb://localhost:27017
```
Tạo database tên: `air_components_manager` (tự động tạo khi chạy seed)

---

## BƯỚC 2 — Cài đặt & chạy Backend

```bash
# Di chuyển vào thư mục backend
cd air-components-manager/backend

# Cài dependencies
npm install

# Thêm dữ liệu mẫu vào MongoDB
node seed.js

# Khởi động server (development)
npm run dev
```

✅ Server sẽ chạy tại: `http://localhost:5000`

**Kiểm tra hoạt động:**
```bash
curl http://localhost:5000/api/components/stats
```

---

## BƯỚC 3 — Tìm IP LAN của máy tính

### Windows:
```bash
ipconfig
# Tìm dòng "IPv4 Address" trong WiFi adapter
# Ví dụ: 192.168.1.100
```

### macOS:
```bash
ifconfig | grep "inet " | grep -v 127
# Ví dụ: inet 192.168.1.100
```

### Linux:
```bash
hostname -I
```

---

## BƯỚC 4 — Cập nhật IP trong Mobile App

Mở file: `mobile/src/api/apiClient.js`

Tìm dòng:
```js
const BASE_URL = 'http://192.168.1.100:5000/api';
```

Thay `192.168.1.100` bằng IP LAN thực tế của máy bạn.

---

## BƯỚC 5 — Cài đặt & chạy Mobile App

```bash
# Di chuyển vào thư mục mobile
cd air-components-manager/mobile

# Cài dependencies
npm install

# Khởi động Expo
npx expo start
```

Expo sẽ hiển thị **QR Code** trong terminal.

**Quét QR Code:**
- **iOS:** Mở Camera app → quét QR → mở Expo Go
- **Android:** Mở app Expo Go → nhấn "Scan QR Code" → quét

---

## BƯỚC 6 — Xác nhận hoạt động

Khi app mở thành công:
1. ✅ Dashboard hiển thị tổng số linh kiện từ MongoDB
2. ✅ Tab Linh kiện in ra danh sách 10 linh kiện mẫu
3. ✅ Tab Mượn/Trả có thể tạo phiếu mượn mới

---

## Xử lý lỗi thường gặp

### ❌ "Network Error" / Không kết nối được
- Kiểm tra điện thoại và máy tính cùng WiFi
- Kiểm tra đúng IP trong `apiClient.js`
- Kiểm tra firewall chặn port 5000:
  ```bash
  # Windows (PowerShell admin)
  netsh advfirewall firewall add rule name="Node 5000" dir=in action=allow protocol=TCP localport=5000
  ```

### ❌ MongoDB không kết nối
- Kiểm tra MongoDB service đang chạy:
  ```bash
  # Windows: Services → MongoDB
  # macOS: brew services start mongodb-community
  ```

### ❌ Expo không tìm thấy module
```bash
npx expo install        # Cài đúng version theo Expo SDK
npx expo start --clear  # Xóa cache và khởi động lại
```

---

## API Endpoints tham khảo

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/components/stats` | Thống kê Dashboard |
| GET | `/api/components` | Danh sách linh kiện |
| GET | `/api/components?search=Arduino` | Tìm kiếm |
| GET | `/api/components?category=Cảm biến` | Lọc theo loại |
| POST | `/api/components` | Thêm linh kiện |
| PUT | `/api/components/:id` | Cập nhật |
| DELETE | `/api/components/:id` | Xóa |
| GET | `/api/borrows?status=borrowing` | Phiếu đang mượn |
| POST | `/api/borrows` | Tạo phiếu mượn |
| PUT | `/api/borrows/:id/return` | Xác nhận trả |

---

## Cấu trúc thư mục

```
air-components-manager/
├── backend/
│   ├── src/
│   │   ├── config/db.js          ← Kết nối MongoDB
│   │   ├── models/               ← Mongoose Schemas
│   │   ├── routes/               ← RESTful API routes
│   │   └── middleware/           ← Error handler
│   ├── server.js                 ← Entry point
│   └── seed.js                   ← Dữ liệu mẫu
│
└── mobile/
    ├── src/
    │   ├── api/apiClient.js      ← Axios + API functions
    │   ├── components/           ← Card, Button, Header...
    │   ├── screens/              ← 4 màn hình chính
    │   ├── navigation/           ← Bottom Tab Navigator
    │   └── theme/theme.js        ← Design system
    └── App.js                    ← Entry point
```

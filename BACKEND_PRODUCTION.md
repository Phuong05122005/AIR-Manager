# Hướng dẫn deploy backend production

## 1. Mục tiêu
Đưa backend API `server.js` lên môi trường public để app release trên Google Play có thể kết nối từ xa.

## 2. Yêu cầu backend
- Node.js
- MongoDB (hoặc MongoDB Atlas)
- Biến môi trường:
  - `MONGO_URI` (chuỗi kết nối MongoDB)
  - `PORT` (mặc định 5000 nếu không cấu hình)

## 3. Cách deploy nhanh bằng Render / Railway / Heroku
### Render
1. Tạo tài khoản Render.com
2. Tạo Web Service mới
3. Chọn repository GitHub chứa dự án
4. Build command: `npm install`
5. Start command: `node server.js`
6. Thiết lập Environment Variables:
   - `MONGO_URI`: chuỗi kết nối MongoDB Atlas hoặc MongoDB production
7. Sau khi deploy xong, backend sẽ chạy tại URL dạng `https://your-app.onrender.com`

### Railway
1. Tạo project mới tại Railway.app
2. Kết nối repository
3. Chọn service Web
4. Build command: `npm install`
5. Start command: `node server.js`
6. Thiết lập biến môi trường giống Render

### Heroku
1. Tạo app mới trên Heroku
2. Kết nối GitHub repo
3. Buildpacks: Node.js
4. Config Vars: `MONGO_URI`
5. Deploy branch chính

## 4. Cập nhật app mobile
- Mở `app.json`
- Thay giá trị `expo.extra.apiUrl` bằng URL backend production thật, ví dụ:
  - `https://api.aircomponentsmanager.com/api`
- Build lại `.aab`

## 5. Kiểm tra
- Truy cập `https://your-backend-url/` phải trả về JSON `status: OK`
- Truy cập `https://your-backend-url/api/components/stats` phải trả về dữ liệu
- Build app release và kiểm tra app có kết nối được backend production

## 6. Lưu ý
- Nếu backend chỉ chạy HTTP, app release vẫn kết nối được nhưng tốt nhất nên dùng HTTPS cho bảo mật.
- Sau khi deploy, dùng URL production trong `app.json` và không dùng IP LAN nữa.

# Chuẩn bị nội dung và hình ảnh cho Google Play

## 1. Thông tin ứng dụng cần chuẩn bị
- Tên ứng dụng (Title)
- Mô tả ngắn (Short description)
- Mô tả đầy đủ (Full description)
- Thể loại (Category): ví dụ `Productivity`, `Tools`, `Business`
- Email hỗ trợ
- Website / trang chủ
- Privacy Policy URL
- Chính sách nội dung / đối tượng người dùng

## 2. Nội dung mô tả mẫu
### Tiêu đề (Title)
AI Robotic

### Mô tả ngắn
Quản lý linh kiện, mượn trả và kiểm kê dễ dàng bằng quét mã vạch.

### Mô tả đầy đủ
AI Robotic là ứng dụng quản lý linh kiện thông minh cho các phòng thí nghiệm và xưởng sản xuất.

Tính năng chính:
- Quét mã vạch linh kiện bằng Camera
- Xem thông tin linh kiện, số lượng và vị trí
- Quản lý mượn trả linh hoạt
- Phân quyền quản trị và người dùng
- Báo cáo audit log và lịch sử mượn trả

Ứng dụng phù hợp cho:
- Kỹ thuật viên, quản lý kho
- Phòng thí nghiệm, xưởng sản xuất, trường nghề

### Từ khóa gợi ý
quản lý linh kiện, mượn trả, quản lý kho, quét mã vạch, inventory

## 3. Hình ảnh và yêu cầu ảnh chụp màn hình
- Chuẩn bị ít nhất 4-5 ảnh chụp màn hình chính của app
- Kích thước tối thiểu: 1080 x 1920 pixels (theo yêu cầu Play Console)
- Bao gồm hình ảnh:
  - Trang đăng nhập
  - Màn hình dashboard/kho
  - Chức năng quét mã vạch
  - Danh sách/chi tiết linh kiện

## 4. Các bước chuẩn bị nhanh
1. Upload ảnh chụp màn hình vào Play Console
2. Cập nhật mô tả ngắn và mô tả đầy đủ
3. Nhập email hỗ trợ và website
4. Nhập URL `Privacy Policy` từ file `PRIVACY_POLICY.md` hoặc trang web của bạn
5. Chọn thể loại và đối tượng phù hợp

## 5. Nội dung thay thế cần chỉnh sửa trước khi phát hành
- `PRIVACY_POLICY.md`: thay email và website bằng thông tin thật
- `app.json` → `extra.apiUrl`: thay `https://YOUR_BACKEND_URL/api` bằng URL backend production thực tế
- Tăng `android.versionCode` nếu là bản cập nhật

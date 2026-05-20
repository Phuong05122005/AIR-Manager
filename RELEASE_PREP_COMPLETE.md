# Release Prep Status

## Đã hoàn thành
- Đã cấu hình `app.json` để dùng `expo.extra.apiUrl` cho backend production.
- Đã cập nhật `src/api/apiClient.js`:
  - production build dùng `expo.extra.apiUrl`
  - dev build vẫn dùng host Expo/Metro hoặc IP LAN fallback
  - cảnh báo nếu production build không có `apiUrl`
- Đã tạo/gửi văn bản hỗ trợ:
  - `PRIVACY_POLICY.md`
  - `PLAY_STORE_PREP.md`
  - `BACKEND_PRODUCTION.md`
- Đã cập nhật `HUONG_DAN_BUILD_AAB.md` với cảnh báo backend production và API URL.
- Đã cài EAS CLI trong môi trường hiện tại.

## Cần hoàn tất bằng tay
1. Deploy backend lên hosting public với HTTPS.
2. Lấy URL backend production và thay vào `app.json`:
   - `expo.extra.apiUrl`: `https://YOUR_BACKEND_URL/api`
3. Cập nhật `PRIVACY_POLICY.md` bằng email/website thật.
4. Chuẩn bị ảnh screenshot, mô tả, tiêu đề theo `PLAY_STORE_PREP.md`.
5. Đăng nhập Expo bằng `npx eas login`.
6. Chạy build `.aab` bằng:
   - `cd d:\v2`
   - `npx eas build --platform android --profile production`
7. Upload file `.aab` lên Google Play Console.

## Lưu ý
- Tôi không thể deploy backend hay upload Google Play trực tiếp từ môi trường hiện tại vì cần thông tin tài khoản / hosting riêng.
- Bạn có thể cung cấp URL backend và thông tin liên hệ để tôi cập nhật tiếp.

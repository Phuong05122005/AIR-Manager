# Hướng dẫn tạo file `.aab` (AI Robotic)

Cấu hình build đã được thêm **chỉ phục vụ đóng gói CH Play**, **không đổi** logic app / API / `npm run dev`.

## Đã thêm vào dự án (không ảnh hưởng chạy dev)

| File | Mục đích |
|------|----------|
| `eas.json` | Cấu hình build production → Android **App Bundle (.aab)** |
| `babel.config.js` | Chuẩn Expo (bắt buộc khi build, không đổi hành vi app) |
| `.easignore` | Bỏ file rác khi upload lên EAS |
| `app.json` → `android.versionCode: 1` | Số phiên bản Android cho CH Play |
| `package.json` → script `build:aab` | Lệnh build nhanh |

**Không sửa:** `apiClient.js`, `server.js`, màn hình, database.

---

## Bước 1 — Cài EAS CLI (một lần)

```powershell
npm install -g eas-cli
```

## Bước 2 — Đăng nhập Expo (miễn phí)

Tạo tài khoản tại https://expo.dev nếu chưa có.

```powershell
cd d:\v2
eas login
```

## Bước 3 — Liên kết project với Expo (một lần)

```powershell
eas init
```

Chọn tạo project mới hoặc link project có sẵn. Lệnh này có thể thêm `extra.eas.projectId` vào `app.json` — **vẫn chạy `npm run dev` bình thường**.

## Bước 4 — Build file `.aab`

```powershell
cd d:\v2
npm run build:aab
```

Hoặc:

```powershell
eas build --platform android --profile production
```

- Build chạy trên cloud Expo (khoảng 10–20 phút).
- Xong sẽ có **link tải file `.aab`** trên terminal hoặc https://expo.dev → Projects → Builds.

## Bước 5 — Upload lên CH Play

1. Vào [Google Play Console](https://play.google.com/console)
2. Ứng dụng → **Production** (hoặc Internal testing)
3. **Create new release** → upload file `.aab` vừa tải

---

## Build trên máy Windows (không dùng cloud)

Cần cài **Android Studio** + SDK. Sau đó:

```powershell
npm run build:aab:local
```

---

## Lưu ý quan trọng

1. **Dev vẫn như cũ:** `npm run dev` + Expo Go + API LAN không đổi.
2. **Bản `.aab` cài từ CH Play** phải dùng backend production công khai. Đã cập nhật `app.json` để cấu hình `expo.extra.apiUrl`; trước khi build release bạn cần thay `https://YOUR_BACKEND_URL/api` bằng URL backend production thật.
3. Nếu vẫn đang phát triển local thì tiếp tục dùng `npm run dev` và IP nội bộ.
4. Mỗi lần upload CH Play mới: tăng `versionCode` trong `app.json` (2, 3, 4…).

---

## Lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| `Not logged in` | Chạy `eas login` |
| Thiếu `projectId` | Chạy `eas init` |
| Build fail thiếu icon | Kiểm tra `assets/icon.png` tồn tại |

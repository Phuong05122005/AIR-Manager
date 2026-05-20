# build-aab.ps1
# Chạy file này sau khi đã đăng nhập Expo và cập nhật expo.extra.apiUrl trong app.json.

cd $PSScriptRoot
Write-Host "Running EAS build for Android production..."
npx eas whoami
npx eas build --platform android --profile production

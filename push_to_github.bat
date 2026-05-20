@echo off
echo ===================================================
echo   TIEN TRINH DAY CODE LEN GITHUB TU DONG
echo ===================================================
echo.

echo [+] 1. Dang khoi tao Git trong thu muc...
git init

echo [+] 2. Lien ket voi kho luu tru GitHub cua ban...
git remote remove origin 2>nul
git remote add origin https://github.com/Phuong05122005/AIR-Manager.git

echo [+] 3. Them tat ca file vao hang cho (da loai tru thu muc nang)...
git add .

echo [+] 4. Tao Commit danh dau phien ban...
git commit -m "Initialize AIR Components Manager App"

echo [+] 5. Dat ten nhanh chinh la main...
git branch -M main

echo [+] 6. Dang day toan bo ma nguon len GitHub...
echo (Neu co hop thoai yeu cau dang nhap hien len, ban hay chon 'Sign in with browser' nhe!)
git push -u origin main

echo.
echo ===================================================
echo   HOAN THANH! Kiem tra kho luu tru GitHub cua ban!
echo ===================================================
pause

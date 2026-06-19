@echo off
echo ==========================================
echo Git Upload Script - web-kuis-v2
echo ==========================================
echo.
echo Menampilkan status repository saat ini:
git status
echo.
set /p commit_msg="Masukkan pesan commit (kosongkan untuk default 'Update web-kuis-v2'): "
if "%commit_msg%"=="" set commit_msg=Update web-kuis-v2

echo.
echo Menambahkan file ke staging area...
git add .

echo.
echo Melakukan commit dengan pesan: "%commit_msg%"
git commit -m "%commit_msg%"

echo.
echo Mengupload (Push) ke repositori GitHub...
git push origin main

echo.
echo Selesai!
pause
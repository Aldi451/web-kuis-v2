@echo off
cls
echo ==========================================
echo Git Restore / QuestionV2
echo ==========================================
echo.
echo Pilih opsi pemulihan/sinkronisasi:
echo [1] Update (Git Pull) - Mengambil update terbaru dari GitHub tanpa menghapus perubahan lokal.
echo [2] Hard Reset (Restore) - HAPUS SEMUA PERUBAHAN LOKAL dan samakan persis dengan repositori GitHub.
echo [3] Batal.
echo.
set /p opt="Pilih opsi (1/2/3): "

if "%opt%"=="1" goto pull
if "%opt%"=="2" goto reset
if "%opt%"=="3" goto end
goto invalid

:pull
echo.
echo Menjalankan git pull origin main...
git pull origin main
goto end

:reset
echo.
echo PENGINGAT: Pilihan ini akan menghapus semua modifikasi lokal Anda secara permanen!
set /p confirm="Apakah Anda yakin ingin melanjutkan? (Y/N): "
if /i "%confirm%"=="Y" (
    echo.
    echo Menjalankan git fetch dan git reset...
    git fetch origin
    git reset --hard origin/main
    git clean -fd
    echo Repositori lokal telah di-restore sesuai dengan GitHub.
) else (
    echo Proses dibatalkan.
)
goto end

:invalid
echo Pilihan tidak valid.
goto end

:end
echo.
echo Selesai!
pause

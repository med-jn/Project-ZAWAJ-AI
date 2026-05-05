@echo off
chcp 65001 >nul
title ZAWAJ AI — Release Builder

echo.
echo  ╔══════════════════════════════════════╗
echo  ║       ZAWAJ AI — Release Builder     ║
echo  ╚══════════════════════════════════════╝
echo.

set PROJECT_DIR=C:\Users\lumina\Desktop\Project ZAWAJ AI
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set OUTPUT_APK=%PROJECT_DIR%\android\app\build\outputs\apk\release\app-release.apk
set OUTPUT_AAB=%PROJECT_DIR%\android\app\build\outputs\bundle\release\app-release.aab
set RELEASE_DIR=%PROJECT_DIR%\releases

cd /d "%PROJECT_DIR%"

:: ═══ 1. رفع رقم الإصدار ═══
echo [1/5] تحديث رقم الإصدار...
call npm version patch --no-git-tag-version
call node sync-version.js
if errorlevel 1 ( echo ❌ فشل تحديث الإصدار & pause & exit /b 1 )
echo ✅ الإصدار محدّث
echo.

:: ═══ 2. بناء Next.js ═══
echo [2/5] بناء Next.js...
call npm run build
if errorlevel 1 ( echo ❌ فشل بناء Next.js & pause & exit /b 1 )
echo ✅ Next.js جاهز
echo.

:: ═══ 3. مزامنة Capacitor ═══
echo [3/5] مزامنة Capacitor...
call npx cap sync android
if errorlevel 1 ( echo ❌ فشلت المزامنة & pause & exit /b 1 )
echo ✅ Capacitor جاهز
echo.

:: ═══ 4. بناء APK + AAB ═══
echo [4/5] بناء APK و AAB...
cd android
call gradlew assembleRelease bundleRelease
if errorlevel 1 ( echo ❌ فشل البناء & pause & exit /b 1 )
echo ✅ البناء ناجح
echo.

:: ═══ 5. حفظ الملفات ═══
echo [5/5] حفظ الملفات...
cd /d "%PROJECT_DIR%"
if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

:: قراءة رقم الإصدار الحالي
for /f "tokens=2 delims=:, " %%v in ('findstr "version" package.json') do (
    set VERSION=%%~v
    goto :found
)
:found

copy /y "%OUTPUT_APK%" "%RELEASE_DIR%\zawaj-ai-v%VERSION%.apk" >nul
copy /y "%OUTPUT_AAB%" "%RELEASE_DIR%\zawaj-ai-v%VERSION%.aab" >nul

echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║              ✅ تم بنجاح!                    ║
echo  ║                                              ║
echo  ║  📱 APK: releases\zawaj-ai-v%VERSION%.apk    ║
echo  ║  📦 AAB: releases\zawaj-ai-v%VERSION%.aab    ║
echo  ║                                              ║
echo  ║  ⬆️  لا تنسَ: git push لرفع التحديث OTA     ║
echo  ╚══════════════════════════════════════════════╝
echo.
pause
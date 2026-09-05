@echo off
chcp 65001 >nul
title ZAWAJ AI - Release Builder

set PROJECT_DIR=C:\Users\lumina\Desktop\Project ZAWAJ AI
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set OUTPUT_APK=%PROJECT_DIR%\android\app\build\outputs\apk\release\app-release.apk
set OUTPUT_AAB=%PROJECT_DIR%\android\app\build\outputs\bundle\release\app-release.aab
set RELEASE_DIR=%PROJECT_DIR%\releases

cd /d "%PROJECT_DIR%"

echo.
echo  ==========================================
echo   ZAWAJ AI - Release Builder
echo  ==========================================
echo.

:: === 1. Bump version ===
echo [1/6] Choose version bump type:
echo 1) Patch (x.y.z+1)  - Minor bug fixes [Default]
echo 2) Minor (x.y+1.0)  - New features
echo 3) Major (x+1.0.0)  - Major update
echo.

set CHOICE=1
set /p CHOICE="Enter choice (1-3) [Default: 1]: "

if "%CHOICE%"=="2" (
    set BUMP=minor
) else if "%CHOICE%"=="3" (
    set BUMP=major
) else (
    set BUMP=patch
)

echo Bumping version as [%BUMP%]...
call npm version %BUMP% --no-git-tag-version
if errorlevel 1 ( echo FAILED: version bump & pause & exit /b 1 )

:: === 2. Sync version to build.gradle + update-info.json ===
echo [2/6] Syncing version...
call node sync-version.js
if errorlevel 1 ( echo FAILED: sync-version & pause & exit /b 1 )

:: === 3. Build Next.js + zip ===
echo [3/6] Building Next.js...
call npm run build
if errorlevel 1 ( echo FAILED: next build & pause & exit /b 1 )

:: === 4. Sync Capacitor ===
echo [4/6] Syncing Capacitor...
call npx cap sync android
if errorlevel 1 ( echo FAILED: cap sync & pause & exit /b 1 )

:: === 5. Build APK + AAB ===
echo [5/6] Building APK + AAB...
cd android
call gradlew assembleRelease bundleRelease
if errorlevel 1 ( echo FAILED: gradle build & pause & exit /b 1 )
cd /d "%PROJECT_DIR%"

:: === 6. Copy to releases + Git push ===
echo [6/6] Saving files + pushing to Vercel...
if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

:: Read version from package.json
for /f "tokens=2 delims=:, " %%v in ('findstr "\"version\"" package.json') do (
    set RAW=%%~v
    goto :gotver
)
:gotver
set VERSION=%RAW: =%

copy /y "%OUTPUT_APK%" "%RELEASE_DIR%\zawaj-ai-v%VERSION%.apk" >nul
copy /y "%OUTPUT_AAB%" "%RELEASE_DIR%\zawaj-ai-v%VERSION%.aab" >nul

git add .
git commit -m "Release v%VERSION%"
git push
if errorlevel 1 ( echo WARNING: git push failed & pause )

echo.
echo  ==========================================
echo   SUCCESS! v%VERSION%
echo   APK: releases\zawaj-ai-v%VERSION%.apk
echo   AAB: releases\zawaj-ai-v%VERSION%.aab
echo   Vercel: deployed
echo  ==========================================
echo.
pause
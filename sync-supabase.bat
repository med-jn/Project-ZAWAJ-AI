@echo off
cd /d "%~dp0"

echo ==========================================
echo  ZAWAJ AI - Sync Supabase (Latest Only)
echo ==========================================

if not exist "supabase\backups" mkdir "supabase\backups"

echo [1/3] Pulling database schema, RLS and policies...
supabase db dump --remote -f "supabase\backups\schema.sql"
if errorlevel 1 (
    echo FAILED: schema dump
    pause
    exit /b 1
)

echo [2/3] Updating single latest data backup...
supabase db dump --remote --data-only --use-copy -f "supabase\backups\data.sql"
if errorlevel 1 (
    echo FAILED: data dump
    pause
    exit /b 1
)

echo [3/3] Downloading Edge Functions...
supabase functions download
if errorlevel 1 (
    echo FAILED: functions download
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  DONE! Latest schema, data.sql and functions synced.
echo  Note: data.sql is kept locally only and excluded from Git.
echo ==========================================
pause
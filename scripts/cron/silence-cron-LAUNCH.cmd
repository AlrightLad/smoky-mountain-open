@echo off
REM ==========================================================================
REM silence-cron-LAUNCH.cmd
REM
REM ONE-TIME setup: silences PARBAUGHS scheduled tasks so they no longer flash
REM a PowerShell window during cron runs (which was tabbing Founder out of
REM games/browsing). Requires admin elevation because existing tasks have
REM RunLevel=Highest. After this runs once, the tasks are reset to:
REM   - Hidden=True
REM   - RunLevel=Limited
REM   - Uses wscript.exe + run-hidden.vbs wrapper for truly invisible launch
REM
REM HOW TO USE:
REM   Right-click this file -> "Run as administrator"
REM   Approve the UAC prompt once.
REM   Window closes when done (or pauses on error).
REM ==========================================================================

cd /d "%~dp0"

REM Self-elevate if not running as admin.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Requesting admin elevation...
  powershell.exe -NoProfile -Command "Start-Process cmd.exe -ArgumentList '/c %~f0' -Verb RunAs"
  exit /b 0
)

echo Running PARBAUGHS cron silencer (admin context)...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0silence-cron-rebuild.ps1"

echo.
echo Done. Press any key to close...
pause >nul

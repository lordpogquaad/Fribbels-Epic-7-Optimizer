@echo off
cd /d "%~dp0..\.."
title Pog E7 Optimizer - Dev
set "PATH=E:\Node;F:\VSCode-Data\npm-global;%APPDATA%\npm;%PATH%"
set "JAVA_HOME=F:\VSCode-Data\jdk\jdk-25.0.3+9"

REM --- Separate-process logging controls. The renderer switchboard is 5. Dev Only\LogControl.js;
REM     these env vars control the processes that cannot read it. Defaults = current behavior. ---
set "E7_BUILD_QUIET="
set "E7_SCANNER_DEBUG="
REM     E7_FILE_LOG=0 disables the main process's half of the 5. Dev Only\logs\latest.log
REM     file sink (5. Dev Only\FileLog.js); the renderer's half is FLAGS.fileLog in
REM     LogControl.js. Default (unset) = ON, unlike the two switches above.
set "E7_FILE_LOG="

REM --- Preflight: fail loudly (with a fixable message) if a pinned prerequisite is missing ---
if not exist "package.json" (
    echo.
    echo ERROR: package.json not found in "%CD%".
    echo        This script must run from the "1. App" folder ^(has the layout moved?^).
    pause
    exit /b 1
)
if not exist "E:\Node\node.exe" (
    echo.
    echo ERROR: Node not found at E:\Node\node.exe.
    echo        Update the Node path in the PATH line of this script.
    pause
    exit /b 1
)
if not exist "%JAVA_HOME%\bin\java.exe" (
    echo.
    echo ERROR: Java 25 JDK not found at "%JAVA_HOME%".
    echo        Update JAVA_HOME in this script.
    pause
    exit /b 1
)

call yarn dev
if %errorlevel% neq 0 (
    echo.
    echo ERROR: yarn dev failed with code %errorlevel%
    pause
)

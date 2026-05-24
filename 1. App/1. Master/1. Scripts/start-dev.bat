@echo off
cd /d "%~dp0..\.."
title Pog E7 Optimizer - Dev
set "PATH=E:\Node;%APPDATA%\npm;%PATH%"
call "%APPDATA%\npm\yarn.cmd" dev
if %errorlevel% neq 0 (
    echo.
    echo ERROR: yarn dev failed with code %errorlevel%
    pause
)

@echo off
:: GitHub Directory Downloader Windows Installation Script
:: This script installs the GitHub Directory Downloader tool system-wide

echo Installing GitHub Directory Downloader...

:: Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: This script must be run as Administrator
    echo Right-click on the script and select "Run as administrator"
    pause
    exit /b 1
)

:: Define installation paths
set INSTALL_DIR=%ProgramFiles%\ghdir
set COMMAND_NAME=ghdir.cmd

:: Create installation directory if it doesn't exist
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Get the script directory and project directory
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

:: Copy the project files to the installation directory
echo Copying files to %INSTALL_DIR%...
xcopy /E /I /Y "%PROJECT_DIR%\dist" "%INSTALL_DIR%\dist"
xcopy /E /I /Y "%PROJECT_DIR%\node_modules" "%INSTALL_DIR%\node_modules"
copy /Y "%PROJECT_DIR%\package.json" "%INSTALL_DIR%"

:: Create a wrapper script in a directory that's in the PATH
echo Creating wrapper script...
set WRAPPER_PATH=%INSTALL_DIR%\%COMMAND_NAME%

echo @echo off > "%WRAPPER_PATH%"
echo node "%INSTALL_DIR%\dist\index.js" %%* >> "%WRAPPER_PATH%"

:: Add the installation directory to the system PATH if it's not already there
echo Adding installation directory to PATH...
setx PATH "%PATH%;%INSTALL_DIR%" /M

echo Installation complete!
echo.
echo You can now use the command 'ghdir' to download GitHub directories.
echo Examples:
echo   ghdir https://github.com/user/repo/tree/main/src
echo   ghdir clone https://github.com/user/repo/tree/main/src my-project
echo.
echo Note: You may need to restart your command prompt or terminal for the 'ghdir' command to be available.

pause

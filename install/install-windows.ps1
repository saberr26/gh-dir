# GitHub Directory Downloader Windows Installation Script (PowerShell)
# This script installs the GitHub Directory Downloader tool system-wide

# Check for admin privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Error: This script must be run as Administrator. Right-click on the script and select 'Run as Administrator'."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Installing GitHub Directory Downloader..." -ForegroundColor Green

# Define installation paths
$INSTALL_DIR = "$env:ProgramFiles\ghdir"
$COMMAND_NAME = "ghdir.ps1"

# Create installation directory if it doesn't exist
if (-not (Test-Path $INSTALL_DIR)) {
    New-Item -ItemType Directory -Path $INSTALL_DIR | Out-Null
}

# Get the script directory and project directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = Split-Path -Parent $SCRIPT_DIR

# Copy the project files to the installation directory
Write-Host "Copying files to $INSTALL_DIR..." -ForegroundColor Yellow
Copy-Item -Path "$PROJECT_DIR\dist" -Destination "$INSTALL_DIR" -Recurse -Force
Copy-Item -Path "$PROJECT_DIR\node_modules" -Destination "$INSTALL_DIR" -Recurse -Force
Copy-Item -Path "$PROJECT_DIR\package.json" -Destination "$INSTALL_DIR" -Force

# Create a wrapper script
Write-Host "Creating wrapper script..." -ForegroundColor Yellow
$WRAPPER_PATH = "$INSTALL_DIR\$COMMAND_NAME"
$WRAPPER_CONTENT = @"
#!/usr/bin/env pwsh
node "$INSTALL_DIR\dist\index.js" `$args
"@
Set-Content -Path $WRAPPER_PATH -Value $WRAPPER_CONTENT

# Create a batch file wrapper for cmd.exe users
$BATCH_WRAPPER_PATH = "$INSTALL_DIR\ghdir.cmd"
$BATCH_WRAPPER_CONTENT = @"
@echo off
node "$INSTALL_DIR\dist\index.js" %*
"@
Set-Content -Path $BATCH_WRAPPER_PATH -Value $BATCH_WRAPPER_CONTENT

# Add the installation directory to the system PATH if it's not already there
Write-Host "Adding installation directory to PATH..." -ForegroundColor Yellow
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
if ($currentPath -notlike "*$INSTALL_DIR*") {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$INSTALL_DIR", "Machine")
}

# Create a shortcut in the Start Menu
$startMenuPath = "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\GitHub Directory Downloader"
if (-not (Test-Path $startMenuPath)) {
    New-Item -ItemType Directory -Path $startMenuPath | Out-Null
}

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$startMenuPath\GitHub Directory Downloader.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$WRAPPER_PATH`""
$Shortcut.WorkingDirectory = "%USERPROFILE%"
$Shortcut.Description = "Download GitHub directories directly from the terminal"
$Shortcut.Save()

Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now use the command 'ghdir' to download GitHub directories." -ForegroundColor Yellow
Write-Host "Examples:" -ForegroundColor Yellow
Write-Host "  ghdir https://github.com/user/repo/tree/main/src"
Write-Host "  ghdir clone https://github.com/user/repo/tree/main/src my-project"
Write-Host ""
Write-Host "Note: You may need to restart your PowerShell or command prompt for the 'ghdir' command to be available." -ForegroundColor Yellow

Read-Host "Press Enter to exit"

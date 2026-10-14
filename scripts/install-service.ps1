# ==============================================================================
# chuanban-antigravity-theme-patch: Windows Background Service Installer
# ==============================================================================

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$daemonScript = Join-Path $rootDir "src\daemon.js"
$taskName = "AntigravityThemePatchDaemon"

Write-Host ">>> [1/3] Checking Node.js environment..." -ForegroundColor Cyan
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
    Write-Error "Node.js is not found in PATH! Please install Node.js (18+ recommended)."
}
Write-Host "Found Node.js at: $nodePath" -ForegroundColor Green

Write-Host ">>> [2/3] Checking npm dependencies..." -ForegroundColor Cyan
Push-Location $rootDir
try {
    if (-not (Test-Path "node_modules")) {
        npm install --production
    }
} finally {
    Pop-Location
}

Write-Host ">>> [3/3] Registering Windows Scheduled Task for User Logon..." -ForegroundColor Cyan

# 生成启动 VBS 脚本以静默无黑窗口运行
$vbsPath = Join-Path $rootDir "scripts\run-daemon-hidden.vbs"
$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """$nodePath"" ""$daemonScript""", 0, False
"@
Set-Content -Path $vbsPath -Value $vbsContent -Encoding ASCII

# 创建计划任务在当前用户登录时执行
$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbsPath`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

# 若存在旧任务先解注册
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Auto-run CDP daemon for Google Antigravity UI Patch" | Out-Null

# 立即启动任务
Start-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "  chuanban-antigravity-theme-patch Windows Service Installed!" -ForegroundColor Green
Write-Host "  Scheduled Task: $taskName" -ForegroundColor Green
Write-Host "  Target Script:  $daemonScript" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

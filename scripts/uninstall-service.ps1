# ==============================================================================
# chuanban-antigravity-theme-patch: Windows Service Uninstaller
# ==============================================================================

$taskName = "AntigravityThemePatchDaemon"

Write-Host ">>> Unregistering Scheduled Task: $taskName..." -ForegroundColor Cyan
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue | Out-Null

Write-Host ">>> Terminating active daemon node processes..." -ForegroundColor Cyan
Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like "*chuanban-antigravity-theme-patch*daemon.js*" } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host "=================================================================" -ForegroundColor Green
Write-Host "  Windows background service uninstalled successfully." -ForegroundColor Green
Write-Host "  To completely reset Antigravity:" -ForegroundColor Green
Write-Host "  1. Open Antigravity Settings -> Appearance -> Select 'Default Light'." -ForegroundColor Green
Write-Host "  2. Restart Antigravity." -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

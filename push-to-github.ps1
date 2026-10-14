# ==============================================================================
# chuanban-antigravity-theme-patch: Safe Local Push Script
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   推送到 GitHub (Safe Local Push to GitHub)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$username = "dontblameitonme"
$repoName = "chuanban-antigravity-theme-patch"

# 安全输入 Token（输入时不显示明文）
$tokenInput = Read-Host "请输入您的 GitHub Personal Access Token (输入时不回显)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($tokenInput)
$token = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Token 不能为空，请重试！" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "token $token"
    "User-Agent" = "PowerShell-Local-Pusher"
    "Accept" = "application/vnd.github+json"
}

Write-Host ">>> [1/3] 验证身份与账号权限..." -ForegroundColor Yellow
try {
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
    Write-Host "登录成功！当前用户: $($user.login)" -ForegroundColor Green
    $username = $user.login
} catch {
    Write-Host "鉴权失败: 提供的 Token 无效或已失效，请检查！" -ForegroundColor Red
    exit 1
}

Write-Host ">>> [2/3] 检查远程仓库是否存在..." -ForegroundColor Yellow
try {
    $repo = Invoke-RestMethod -Uri "https://api.github.com/repos/$username/$repoName" -Headers $headers
    Write-Host "远程仓库已存在: $($repo.html_url)" -ForegroundColor Green
} catch {
    Write-Host "远程仓库不存在，正在自动为您创建..." -ForegroundColor Cyan
    $body = @{
        name = $repoName
        description = "Google Antigravity client theme, typography, localization & stability patch based on Chrome DevTools Protocol runtime injection."
        private = $false
    } | ConvertTo-Json

    $newRepo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body
    Write-Host "仓库创建成功: $($newRepo.html_url)" -ForegroundColor Green
}

Write-Host ">>> [3/3] 推送代码到远程分支 main..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir
try {
    git remote remove origin 2>$null
    git remote add origin "https://${token}@github.com/$username/$repoName.git"
    git push -u origin main
    # 清除 URL 中的 token 保护安全
    git remote set-url origin "https://github.com/$username/$repoName.git"
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "恭喜！项目已成功推送至: https://github.com/$username/$repoName" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} catch {
    Write-Host "推送过程发生错误: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

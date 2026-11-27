<#
.SYNOPSIS
    Builds the React frontend and publishes the ASP.NET Core backend (with SPA assets)
    into ./publish ready to upload to MonsterASP.NET.
#>
$ErrorActionPreference = "Stop"

$Root = $PSScriptRoot
$FrontendDir = Join-Path $Root "Frontend"
$BackendDir = Join-Path $Root "Backend"
$WwwRootDir = Join-Path $BackendDir "wwwroot"
$PublishDir = Join-Path $Root "publish"
$ZipPath = Join-Path $Root "PulseDesk-MonsterASP-Deploy.zip"

if (-not $env:NUGET_PACKAGES -and (Test-Path "$env:LOCALAPPDATA\NuGetPackages")) {
    $env:NUGET_PACKAGES = "$env:LOCALAPPDATA\NuGetPackages"
}

Write-Host "1/4 Building React frontend (Vite production bundle)..." -ForegroundColor Cyan
Push-Location $FrontendDir
try {
    if (-not (Test-Path "node_modules")) {
        npm install
    }
    npm run build
}
finally {
    Pop-Location
}

Write-Host "2/4 Copying Frontend/dist into Backend/wwwroot..." -ForegroundColor Cyan
if (Test-Path $WwwRootDir) {
    Remove-Item -Recurse -Force $WwwRootDir
}
New-Item -ItemType Directory -Path $WwwRootDir | Out-Null
Copy-Item -Recurse -Force (Join-Path $FrontendDir "dist\*") $WwwRootDir

Write-Host "3/4 Running backend tests..." -ForegroundColor Cyan
dotnet test (Join-Path $Root "HelpdeskSentiment.sln") -c Release --no-restore

Write-Host "4/4 Publishing ASP.NET Core app to ./publish..." -ForegroundColor Cyan
if (Test-Path $PublishDir) {
    Remove-Item -Recurse -Force $PublishDir
}
dotnet publish (Join-Path $BackendDir "HelpdeskSentiment.Api.csproj") -c Release -o $PublishDir --no-restore

# Do not bundle local dev .env into production publish output
$PublishedDevEnv = Join-Path $PublishDir ".env"
if (Test-Path $PublishedDevEnv) {
    Remove-Item -Force $PublishedDevEnv
}

# Remove appsettings.Development.json from production publish output so Production settings apply cleanly
$PublishedDevJson = Join-Path $PublishDir "appsettings.Development.json"
if (Test-Path $PublishedDevJson) {
    Remove-Item -Force $PublishedDevJson
}

if (Test-Path $ZipPath) {
    Remove-Item -Force $ZipPath
}
Compress-Archive -Path (Join-Path $PublishDir "*") -DestinationPath $ZipPath -Force

Write-Host "`nDone! Upload contents of './publish' (or '$ZipPath') to MonsterASP.NET." -ForegroundColor Green
Write-Host "Remember to configure 'appsettings.Production.json' on the server with your MonsterASP.NET MySQL connection string and JWT key." -ForegroundColor Yellow

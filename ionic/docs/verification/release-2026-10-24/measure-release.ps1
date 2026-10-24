param(
    [string]$JavaHome = 'C:\Program Files\Android\Android Studio\jbr',
    [string]$AndroidHome = $env:ANDROID_HOME
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$env:JAVA_HOME = $JavaHome
$env:ANDROID_HOME = $AndroidHome
$env:Path = "$JavaHome\bin;$env:Path"
$results = [ordered]@{
    date = '2026-10-24'
    timezone = 'Europe/Rome'
    java_home = $JavaHome
    android_home = $AndroidHome
    offline = $true
    download_seconds_this_run = 0
    historical_download_seconds = $null
    phases = @()
}
function Invoke-Phase([string]$Name, [string]$Command, [scriptblock]$Action) {
    $started = [DateTimeOffset]::UtcNow
    $timer = [Diagnostics.Stopwatch]::StartNew()
    & $Action *> (Join-Path $PSScriptRoot "$Name.txt")
    $code = $LASTEXITCODE
    $timer.Stop()
    $results.phases += [ordered]@{
        name = $Name
        command = $Command
        started_utc = $started.ToString('o')
        finished_utc = [DateTimeOffset]::UtcNow.ToString('o')
        elapsed_seconds = [Math]::Round($timer.Elapsed.TotalSeconds, 3)
        exit_code = $code
    }
    $results | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $PSScriptRoot 'build-results.json') -Encoding utf8
    Write-Host "$Name : exit=$code, seconds=$($timer.Elapsed.TotalSeconds)"
    Get-Content (Join-Path $PSScriptRoot "$Name.txt") -Tail 10 | Out-Host
    if ($code -ne 0) { throw "Phase failed: $Name ($code)" }
}
Push-Location $projectRoot
try {
    Invoke-Phase 'dependency-check' 'npm ls --offline --depth=0' { npm.cmd ls --offline --depth=0 }
    Push-Location android
    try {
        Invoke-Phase 'prepare-offline' 'gradlew clean app:dependencies --configuration releaseRuntimeClasspath --offline --no-daemon --max-workers=2 --console=plain' {
            .\gradlew.bat clean app:dependencies --configuration releaseRuntimeClasspath --offline --no-daemon --max-workers=2 --console=plain
        }
    } finally { Pop-Location }
    Invoke-Phase 'build-web-attempt-1' 'npm run build' { npm.cmd run build }
    Invoke-Phase 'sync-android' 'cap sync android (installed local CLI)' { & .\node_modules\.bin\cap.cmd sync android }
    Push-Location android
    try {
        Invoke-Phase 'build-release-attempt-1' 'gradlew app:assembleRelease --offline --no-build-cache --no-daemon --max-workers=2 --console=plain' {
            .\gradlew.bat app:assembleRelease --offline --no-build-cache --no-daemon --max-workers=2 --console=plain
        }
    } finally { Pop-Location }
    New-Item -ItemType Directory -Force artifacts/android | Out-Null
    Invoke-Phase 'sign-release' 'apksigner sign using local Android test certificate' {
        & "$AndroidHome\build-tools\36.0.0\apksigner.bat" sign --ks "$env:USERPROFILE\.android\debug.keystore" --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out artifacts/android/event-check-in-ionic-release.apk android/app/build/outputs/apk/release/app-release-unsigned.apk
    }
    Invoke-Phase 'verify-signature' 'apksigner verify --verbose --print-certs' {
        & "$AndroidHome\build-tools\36.0.0\apksigner.bat" verify --verbose --print-certs artifacts/android/event-check-in-ionic-release.apk
    }
} finally { Pop-Location }

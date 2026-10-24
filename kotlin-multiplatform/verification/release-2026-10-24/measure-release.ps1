param(
    [string]$JavaHome = $env:JAVA_HOME,
    [string]$AndroidHome = $env:ANDROID_HOME
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$env:JAVA_HOME = $JavaHome
$env:ANDROID_HOME = $AndroidHome
$env:Path = "$JavaHome\bin;$env:Path"
$results = [ordered]@{
    date = '2026-10-24'
    timezone = 'Europe/Rome'
    offline = $true
    download_seconds_this_run = 0
    historical_download_seconds = $null
    phases = @()
}
function Invoke-MeasuredTool([string]$Name, [string]$ToolPath, [string[]]$ToolArguments) {
    $started = [DateTimeOffset]::UtcNow
    $timer = [Diagnostics.Stopwatch]::StartNew()
    & $ToolPath @ToolArguments *> (Join-Path $PSScriptRoot "$Name.txt")
    $code = $LASTEXITCODE
    $timer.Stop()
    $results.phases += [ordered]@{
        name = $Name
        tool = $ToolPath
        arguments = $ToolArguments
        started_utc = $started.ToString('o')
        finished_utc = [DateTimeOffset]::UtcNow.ToString('o')
        elapsed_seconds = [Math]::Round($timer.Elapsed.TotalSeconds, 3)
        exit_code = $code
    }
    $results | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $PSScriptRoot 'build-results.json') -Encoding utf8
    Write-Host "$Name : exit=$code, seconds=$($timer.Elapsed.TotalSeconds)"
    Get-Content (Join-Path $PSScriptRoot "$Name.txt") -Tail 12 | Write-Host
    return $code
}
Push-Location $projectRoot
try {
    $code = Invoke-MeasuredTool 'prepare-offline' "$projectRoot\gradlew.bat" @('clean', ':androidApp:dependencies', '--configuration', 'releaseRuntimeClasspath', '--offline', '--no-daemon', '--max-workers=2', '--console=plain')
    if ($code -ne 0) { exit $code }
    $code = Invoke-MeasuredTool 'build-release-attempt-1' "$projectRoot\gradlew.bat" @(':androidApp:assembleRelease', '--offline', '--no-build-cache', '--no-daemon', '--max-workers=2', '--console=plain')
    if ($code -ne 0) { exit $code }
    New-Item -ItemType Directory -Force "$projectRoot\artifacts\android" | Out-Null
    $code = Invoke-MeasuredTool 'sign-release' "$AndroidHome\build-tools\37.0.0\apksigner.bat" @('sign', '--ks', "$env:USERPROFILE\.android\debug.keystore", '--ks-key-alias', 'androiddebugkey', '--ks-pass', 'pass:android', '--key-pass', 'pass:android', '--out', "$projectRoot\artifacts\android\event-check-in-kmp-release.apk", "$projectRoot\androidApp\build\outputs\apk\release\androidApp-release-unsigned.apk")
    if ($code -ne 0) { exit $code }
    & "$AndroidHome\build-tools\37.0.0\apksigner.bat" verify --verbose --print-certs "$projectRoot\artifacts\android\event-check-in-kmp-release.apk" *> (Join-Path $PSScriptRoot 'apk-signature.txt')
    exit $LASTEXITCODE
} finally {
    Pop-Location
}

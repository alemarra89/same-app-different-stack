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
    java_home = $JavaHome
    android_home = $AndroidHome
    offline = $true
    download_seconds_this_run = 0
    historical_download_seconds = $null
    phases = @()
}
function Invoke-MeasuredGradle([string]$Name, [string[]]$GradleArguments) {
    $started = [DateTimeOffset]::UtcNow
    $timer = [Diagnostics.Stopwatch]::StartNew()
    & "$projectRoot\gradlew.bat" @GradleArguments *> (Join-Path $PSScriptRoot "$Name.txt")
    $code = $LASTEXITCODE
    $timer.Stop()
    $results.phases += [ordered]@{
        name = $Name
        command = '.\gradlew.bat ' + ($GradleArguments -join ' ')
        started_utc = $started.ToString('o')
        finished_utc = [DateTimeOffset]::UtcNow.ToString('o')
        elapsed_seconds = [Math]::Round($timer.Elapsed.TotalSeconds, 3)
        exit_code = $code
    }
    $results | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $PSScriptRoot 'build-results.json') -Encoding utf8
    Write-Output "$Name : exit=$code, seconds=$($timer.Elapsed.TotalSeconds)"
    Get-Content (Join-Path $PSScriptRoot "$Name.txt") -Tail 12
    return $code
}
Push-Location $projectRoot
try {
    $prep = @(Invoke-MeasuredGradle 'prepare-offline' @('clean', ':androidApp:dependencies', '--configuration', 'debugRuntimeClasspath', '--offline', '--no-daemon', '--max-workers=2', '--console=plain'))
    $prepCode = $prep[-1]
    $prep | Select-Object -SkipLast 1 | Write-Output
    if ($prepCode -ne 0) { exit $prepCode }
    $build = @(Invoke-MeasuredGradle 'build-debug-attempt-1' @(':androidApp:assembleDebug', '--offline', '--no-build-cache', '--no-daemon', '--max-workers=2', '--console=plain'))
    $buildCode = $build[-1]
    $build | Select-Object -SkipLast 1 | Write-Output
    exit $buildCode
} finally {
    Pop-Location
}

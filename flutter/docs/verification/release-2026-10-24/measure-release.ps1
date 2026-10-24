param(
    [string]$FlutterRoot = 'C:\Users\utente\flutter-sdk\flutter',
    [string]$JavaHome = 'C:\Program Files\Android\Android Studio\jbr'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$env:JAVA_HOME = $JavaHome
$env:Path = "$JavaHome\bin;$env:Path"
$dart = Join-Path $FlutterRoot 'bin/cache/dart-sdk/bin/dart.exe'
$flutterTool = Join-Path $FlutterRoot 'bin/cache/flutter_tools.snapshot'
$results = [ordered]@{
    date = '2026-10-24'
    timezone = 'Europe/Rome'
    variant = 'release'
    method = 'Stopwatch around each process; clean outputs; dependency caches retained; offline Gradle; build cache disabled; universal APK'
    steps = @()
}

function Invoke-MeasuredStep {
    param([string]$Name, [string]$Program, [string[]]$Arguments)
    $started = [DateTimeOffset]::Now
    $timer = [Diagnostics.Stopwatch]::StartNew()
    & $Program @Arguments 2>&1 | Tee-Object -FilePath (Join-Path $PSScriptRoot "$Name.txt")
    $stepExit = $LASTEXITCODE
    $timer.Stop()
    $results.steps += [ordered]@{
        name = $Name
        started = $started.ToString('o')
        finished = [DateTimeOffset]::Now.ToString('o')
        seconds = [Math]::Round($timer.Elapsed.TotalSeconds, 3)
        exitCode = $stepExit
        command = "$Program $($Arguments -join ' ')"
    }
    $results | ConvertTo-Json -Depth 8 | Set-Content (Join-Path $PSScriptRoot 'build-results.json') -Encoding utf8
    Write-Output "MEASUREMENT $Name : $($timer.Elapsed.TotalSeconds) seconds; exit=$stepExit"
    if ($stepExit -ne 0) { throw "Step $Name failed with exit code $stepExit" }
}

Push-Location $projectRoot
try {
    Invoke-MeasuredStep 'clean-flutter' $dart @($flutterTool, 'clean')
    Invoke-MeasuredStep 'pub-offline' $dart @($flutterTool, 'pub', 'get', '--offline')
    Push-Location (Join-Path $projectRoot 'android')
    try {
        Invoke-MeasuredStep 'prepare-gradle-offline' '.\gradlew.bat' @('clean', ':app:dependencies', '--configuration', 'releaseRuntimeClasspath', '--offline', '--no-daemon', '--console=plain')
        Invoke-MeasuredStep 'build-release-attempt-1' '.\gradlew.bat' @(':app:assembleRelease', '--offline', '--no-build-cache', '--no-daemon', '--max-workers=2', '--console=plain')
    } finally { Pop-Location }
} finally { Pop-Location }

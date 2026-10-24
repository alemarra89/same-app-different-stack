param(
    [string]$DeviceSerial = '244f483d',
    [string]$AndroidSdk = 'C:\Users\utente\AppData\Local\Android\Sdk',
    [string]$JavaHome = 'C:\Program Files\Android\Android Studio\jbr'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$env:JAVA_HOME = $JavaHome
$env:Path = "$JavaHome\bin;$env:Path"
$adb = Join-Path $AndroidSdk 'platform-tools/adb.exe'
$aapt = Join-Path $AndroidSdk 'build-tools/36.0.0/aapt.exe'
$apksigner = Join-Path $AndroidSdk 'build-tools/36.0.0/apksigner.bat'
$package = 'it.demo.eventcheckin.flutter'
$results = [ordered]@{ steps = @() }

function Invoke-Phase {
    param([string]$Name, [string]$Program, [string[]]$Arguments)
    $timer = [Diagnostics.Stopwatch]::StartNew()
    & $Program @Arguments 2>&1 | Tee-Object -FilePath (Join-Path $PSScriptRoot "$Name.txt")
    $phaseExit = $LASTEXITCODE
    $timer.Stop()
    $results.steps += [ordered]@{ name=$Name; seconds=[Math]::Round($timer.Elapsed.TotalSeconds,3); exitCode=$phaseExit }
    $results | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $PSScriptRoot 'device-measures.json')
    if ($phaseExit -ne 0) { throw "Phase $Name failed: $phaseExit" }
}

Push-Location $projectRoot
try {
    New-Item -ItemType Directory -Force artifacts/android | Out-Null
    $apk = Join-Path $projectRoot 'artifacts/android/event-check-in-flutter-release.apk'
    Copy-Item -LiteralPath build/app/outputs/apk/release/app-release.apk -Destination $apk
    & $aapt dump badging $apk | Set-Content (Join-Path $PSScriptRoot 'apk-badging.txt')
    if ($LASTEXITCODE -ne 0) { throw 'APK inspection failed' }
    $permissions = & $aapt dump permissions $apk
    $permissions | Set-Content (Join-Path $PSScriptRoot 'apk-permissions.txt')
    if ($permissions -match 'android.permission.INTERNET|android.permission.ACCESS_NETWORK_STATE') { throw 'Unexpected network permission' }
    Invoke-Phase 'apk-signature' $apksigner @('verify','--verbose','--print-certs',$apk)
    $archive = [IO.Compression.ZipFile]::OpenRead($apk)
    try {
        $aotLibraries = @($archive.Entries.FullName | Where-Object { $_ -match '^lib/[^/]+/libapp.so$' })
        $kernel = @($archive.Entries.FullName | Where-Object { $_ -match 'kernel_blob.bin$' })
    } finally { $archive.Dispose() }
    if ($aotLibraries.Count -ne 3 -or $kernel.Count -ne 0) { throw 'Unexpected AOT archive content' }
    [ordered]@{
        path='artifacts/android/event-check-in-flutter-release.apk'
        bytes=(Get-Item $apk).Length
        sha256=(Get-FileHash $apk -Algorithm SHA256).Hash
        aotLibraries=$aotLibraries
        kernelBlobPresent=($kernel.Count -gt 0)
        internetPermissionPresent=$false
    } | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $PSScriptRoot 'apk.json')

    Invoke-Phase 'install' $adb @('-s',$DeviceSerial,'install','-r',$apk)
    & $adb -s $DeviceSerial shell dumpsys package $package | Set-Content (Join-Path $PSScriptRoot 'installed-package.txt')
    $installed = Get-Content (Join-Path $PSScriptRoot 'installed-package.txt') -Raw
    if ($installed -match '\bDEBUGGABLE\b') { throw 'Installed APK is debuggable' }
    $reverse = (& $adb -s $DeviceSerial reverse --list | Out-String).Trim()
    $servers = @(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'dart.exe' -and $_.CommandLine -match 'flutter_tools.*\s(run|attach)\b' } | Select-Object ProcessId,CommandLine)
    [ordered]@{
        capturedAt=[DateTimeOffset]::Now.ToString('o')
        adbReverse=$reverse
        flutterRunOrAttachProcesses=$servers
        installedDebuggable=$false
        apkInternetPermissionPresent=$false
        aotLibraries=$aotLibraries
    } | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $PSScriptRoot 'no-dev-server.json')
    & $adb -s $DeviceSerial shell am force-stop $package
    Invoke-Phase 'launch-initial' $adb @('-s',$DeviceSerial,'shell','am','start','-W','-n',"$package/.MainActivity")
    & $adb -s $DeviceSerial shell uiautomator dump /sdcard/flutter-release-initial.xml 2>&1 | Set-Content (Join-Path $PSScriptRoot 'ui-capture.txt')
    & $adb -s $DeviceSerial pull /sdcard/flutter-release-initial.xml (Join-Path $PSScriptRoot 'release-initial.xml')
    & $adb -s $DeviceSerial shell screencap -p /sdcard/flutter-release-initial.png
    & $adb -s $DeviceSerial pull /sdcard/flutter-release-initial.png (Join-Path $PSScriptRoot 'release-initial.png')
    Write-Output 'Release APK inspected, installed, launched and captured.'
} finally { Pop-Location }

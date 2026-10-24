param(
    [Parameter(Mandatory=$true)]
    [ValidatePattern('^[a-z0-9-]+$')]
    [string]$Tag,
    [string]$DeviceSerial = '244f483d',
    [string]$Adb = 'C:\Users\utente\AppData\Local\Android\Sdk\platform-tools\adb.exe'
)

$ErrorActionPreference = 'Stop'
$activity = & $Adb -s $DeviceSerial shell dumpsys activity activities
if (-not ($activity -match 'mResumedActivity:.*it.demo.eventcheckin.flutter')) {
    throw 'Flutter is not the foreground app; no capture taken.'
}
& $Adb -s $DeviceSerial shell uiautomator dump "/sdcard/flutter-$Tag.xml" 2>&1 |
    Out-File -Append (Join-Path $PSScriptRoot 'ui-capture.txt')
& $Adb -s $DeviceSerial pull "/sdcard/flutter-$Tag.xml" (Join-Path $PSScriptRoot "$Tag.xml")
if ($LASTEXITCODE -ne 0) { throw 'UI capture failed' }
& $Adb -s $DeviceSerial shell screencap -p "/sdcard/flutter-$Tag.png"
& $Adb -s $DeviceSerial pull "/sdcard/flutter-$Tag.png" (Join-Path $PSScriptRoot "$Tag.png")
if ($LASTEXITCODE -ne 0) { throw 'Screenshot capture failed' }
[xml]$ui = Get-Content (Join-Path $PSScriptRoot "$Tag.xml")
$ui.SelectNodes('//node') | Where-Object { $_.text -or $_.'content-desc' } |
    Select-Object text,content-desc | Format-Table -Wrap

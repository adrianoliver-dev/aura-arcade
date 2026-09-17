$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'public\trailers'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$raw = Join-Path $outDir 'loop-raw.mp4'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$userData = Join-Path $root '.chrome-rec'

Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*aura-arcade\.chrome-rec*' } | ForEach-Object {
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

Start-Process -FilePath $chrome -ArgumentList @(
  "--user-data-dir=$userData",
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-session-crashed-bubble',
  '--window-position=40,40',
  '--window-size=480,854',
  '--app=http://127.0.0.1:3020/reel'
)
Start-Sleep -Seconds 2

ffmpeg -y -f gdigrab -framerate 30 -offset_x 40 -offset_y 40 -video_size 480x854 -t 72 -i desktop -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p $raw
Write-Output "WROTE $raw"

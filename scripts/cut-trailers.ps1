$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$dir = Join-Path $root 'public\trailers'
$raw = Join-Path $dir 'loop-raw.mp4'
if (-not (Test-Path $raw)) { throw "missing $raw" }

$crop = 'crop=480:822:0:32,scale=1080:1920'

ffmpeg -y -i $raw -vf $crop -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart (Join-Path $dir 'loop-fexpo-9x16.mp4')

ffmpeg -y -i $raw -filter_complex "[0:v]crop=480:822:0:32,split=2[fg][bg];[bg]scale=1920:1080,boxblur=24:8[b];[fg]scale=-1:1080[p];[b][p]overlay=(W-w)/2:0" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart (Join-Path $dir 'loop-fexpo-16x9.mp4')

ffmpeg -y -ss 54 -t 16 -i $raw -vf $crop -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart (Join-Path $dir 'redes-a-pulso-humo.mp4')

ffmpeg -y -ss 42 -t 16 -i $raw -vf $crop -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart (Join-Path $dir 'redes-b-radio-salida.mp4')

Get-ChildItem $dir -Filter *.mp4 | Format-Table Name, Length

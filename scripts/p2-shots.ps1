#requires -Version 5
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "Chrome no encontrado" }
$dir = "c:\AdrianOliver-dev\Aura\aura-arcade\docs\polish\design-review"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$user = Join-Path $env:TEMP "aura-arcade-chrome-shots"
New-Item -ItemType Directory -Force -Path $user | Out-Null

function Shot([string]$name, [int]$w, [int]$h, [string]$url) {
  $out = Join-Path $dir $name
  & $chrome --headless=new --disable-gpu --hide-scrollbars --user-data-dir=$user --window-size="$w,$h" --virtual-time-budget=16000 --screenshot=$out $url
  if (Test-Path $out) { Write-Output "ok $name $((Get-Item $out).Length)" } else { Write-Output "fail $name" }
}

Shot "ready-390.png" 390 844 "http://127.0.0.1:3032/jugar?shot=ready"
Shot "action-390.png" 390 844 "http://127.0.0.1:3032/jugar?shot=action"
Shot "save-390.png" 390 844 "http://127.0.0.1:3032/jugar?shot=save"
Shot "end-win-390.png" 390 844 "http://127.0.0.1:3032/jugar?shot=end-win"
Shot "end-miss-390.png" 390 844 "http://127.0.0.1:3032/jugar?shot=end-miss"
Shot "gameplay-1920x1080.png" 1920 1080 "http://127.0.0.1:3032/jugar?shot=action"
Shot "attract-1920x1080.png" 1920 1080 "http://127.0.0.1:3032/loop"

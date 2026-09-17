# Captura de trailers — AURA: ANTES DEL HUMO

No usar generadores de video como sustituto. Gameplay 100% de esta build.

## Ventana limpia

```bash
pnpm build
pnpm start
```

Chrome en kiosk, sin DevTools, sin cursor grande:

```text
chrome.exe --kiosk --window-size=1920,1080 http://127.0.0.1:3020/jugar?demo=1
```

Vertical 9:16:

```text
chrome.exe --kiosk --window-size=1080,1920 http://127.0.0.1:3020/jugar?demo=1
```

## ffmpeg (gyan.dev)

Loop 16:9, 15 s, 1080p, primer y último frame conectan (demo cicla):

```bash
ffmpeg -y -f gdigrab -framerate 30 -offset_x 0 -offset_y 0 -video_size 1920x1080 -t 15 -i desktop -c:v libx264 -pix_fmt yuv420p -an public/trailers/loop-fexpo-16x9.mp4
```

Short clutch 9:16:

```bash
ffmpeg -y -f gdigrab -framerate 30 -offset_x 0 -offset_y 0 -video_size 1080x1920 -t 14 -i desktop -c:v libx264 -pix_fmt yuv420p -an public/trailers/short-clutch-9x16.mp4
```

Revisar cada 2–3 s: sin barra de título, sin overlay Next, QR legible, mute-proof.

Si una toma parece prototipo, se descarta.

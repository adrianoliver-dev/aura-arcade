# aura-antes-del-humo-clutch-9x16.mp4

**Archivo:** `public/trailers/final/aura-antes-del-humo-clutch-9x16.mp4`

## Captura / edición

- Viewport 390×844, `/jugar` **sin** `demo=1`.
- Prep: tap `JUGÁ 40 S`, espera 4.5 s (ventana Casa).
- Trazo: `window.__humoGuide()` (coords CSS de la ruta de casa) + arrastre Puppeteer. No es IA.
- 120 JPEG @ 10 fps → scale lanczos 1080×1920.

```
node scripts/p2-capture-9x16.mjs
ffmpeg -y -framerate 10 -i .tmp-p2/frames/aura-antes-del-humo-clutch-9x16/f%04d.jpg -loop 1 -t 12 -i public/qr-arcade.png -f lavfi -t 12 -i anullsrc=channel_layout=stereo:sample_rate=48000 ... scale=1080:1920 ... overlay QR + drawtext JUGÁ 40 S
```

Beats: peligro/casa visible → trazo con ETA `LLEGA` → snap 42 ha → QR + CTA.

## Overlays / audio

| Pieza | Origen |
| --- | --- |
| Texto `JUGÁ 40 S` | `docs/video/final/overlay-clutch.txt` |
| QR | `public/qr-arcade.png` |
| Audio | silencio AAC |

## ffprobe

- 1080×1920 H.264 + AAC
- duración **12.000 s**

## Framegrabs

`docs/video/final/aura-antes-del-humo-clutch-9x16/frame-{1,6,11}s.png`

Revisión: HUD del producto, mute icon, sin chrome de Cursor. El QR del overlay tapa en parte la instrucción de t=11; el predio y el CTA siguen legibles.

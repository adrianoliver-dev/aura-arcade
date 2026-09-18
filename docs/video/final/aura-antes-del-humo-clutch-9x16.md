# aura-antes-del-humo-clutch-9x16.mp4

**Archivo:** `public/trailers/final/aura-antes-del-humo-clutch-9x16.mp4`

## Captura / edición

- Viewport 390×844, `/jugar` **sin** `demo=1`.
- Prep: tap `JUGÁ 40 S`, espera 4.5 s (ventana Casa).
- Trazo humano vía `window.__humoGuide()` + arrastre Puppeteer.
- 120 JPEG @ 10 fps → lanczos 1080×1920.

```
node scripts/p2-capture-9x16.mjs clutch
node scripts/p2-encode-final.mjs clutch
```

Beats: 1 s de peligro → trazo → snap 45 ha → QR + `JUGÁ 40 S` arriba (no sobre la instrucción).

## Overlays / audio

| Pieza | Origen |
| --- | --- |
| Texto `JUGÁ 40 S` | `docs/video/final/aura-antes-del-humo-clutch-9x16-overlay.txt` |
| QR | `public/qr-arcade.png` |
| Audio | silencio AAC |

## ffprobe

- 1080×1920 H.264 + AAC
- duración **12.000 s**

## Framegrabs

`docs/video/final/aura-antes-del-humo-clutch-9x16/frame-{1,6,11}s.png`

Revisión: HUD del producto, sin chrome. El overlay de texto vive bajo el QR, no tapa `Atajo o vuelta`.

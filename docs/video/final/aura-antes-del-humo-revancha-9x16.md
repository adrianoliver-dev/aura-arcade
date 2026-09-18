# aura-antes-del-humo-revancha-9x16.mp4

**Archivo:** `public/trailers/final/aura-antes-del-humo-revancha-9x16.mp4`

## Captura / edición

Montaje ffmpeg de piezas de **esta** build (no gameplay inventado):

1. 2.2 s still real `docs/polish/design-review/end-miss-390.png` (ALERTA / `OTRA RUTA`).
2. 10 s de los mismos frames de trazo/rescate que el clutch (`f%04d.jpg` @ 10 fps).

```
ffmpeg -y -loop 1 -t 2.2 -i docs/polish/design-review/end-miss-390.png -framerate 10 -t 10 -i .tmp-p2/frames/aura-antes-del-humo-clutch-9x16/f%04d.jpg -loop 1 -t 12.2 -i public/qr-arcade.png -f lavfi -t 12.2 -i anullsrc=... concat + QR + drawtext OTRA RUTA
```

Beats: fallo → `OTRA RUTA` → trazo/clutch 42 ha → QR.

## Overlays / audio

| Pieza | Origen |
| --- | --- |
| `OTRA RUTA` (t&lt;2.1) | `docs/video/final/overlay-revancha.txt` |
| QR | `public/qr-arcade.png` |
| Audio | silencio AAC |

MoneyPrinterTurbo se evaluó y se rechazó como fuente de imagen (`docs/polish/research/kiosk-sizzle.md`). El corte es pipeline local reproducible.

## ffprobe

- 1080×1920 H.264 + AAC
- duración **12.300 s** (dentro de 10–14 s)

## Framegrabs

`docs/video/final/aura-antes-del-humo-revancha-9x16/frame-{1,6,11}s.png`

Revisión: el primer bloque es un still (no hay cursor). El segundo es el mismo trazo humano registrado. Corte visible en t≈2.2; no hay tearing ni UI de Cursor.

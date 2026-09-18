# aura-antes-del-humo-revancha-9x16.mp4

**Archivo:** `public/trailers/final/aura-antes-del-humo-revancha-9x16.mp4`

## Captura / edición

- Viewport 390×844, `/jugar?shot=end-miss`.
- Primeros ~2 s: fallo `ALERTA` + CTA `OTRA RUTA` (click in-page a 1.8 s).
- `OTRA RUTA` ahora arranca la ronda (`startRun().then(beginPlay)`), no un segundo tap a `JUGÁ`.
- Trazo `.__humoGuide()` a ~7.2 s.

```
node scripts/p2-capture-9x16.mjs revancha
node scripts/p2-encode-final.mjs revancha
```

Beats: falla cercana → `OTRA RUTA` → clutch 45 ha / QR.

## Overlays / audio

| Pieza | Origen |
| --- | --- |
| Texto `OTRA RUTA` | solo t=0.3–3.2 s (`…-overlay.txt`) para no duplicar el botón en gameplay |
| QR | `public/qr-arcade.png` |
| Audio | silencio AAC |

## ffprobe

- 1080×1920 H.264 + AAC
- duración **12.000 s**

## Framegrabs

`docs/video/final/aura-antes-del-humo-revancha-9x16/frame-{1,6,11}s.png`

Revisión: el CTA del producto cabe entero en 390×844. Overlay de ffmpeg no tapa el botón. Gameplay posterior coincide con esta build.

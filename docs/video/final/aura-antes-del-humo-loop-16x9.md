# aura-antes-del-humo-loop-16x9.mp4

**Archivo:** `public/trailers/final/aura-antes-del-humo-loop-16x9.mp4`

## Captura / edición

- Viewport 1920×1080, `/jugar?demo=1` (attract permitido).
- 104 JPEG @ 8 fps → scale 1920×1080.
- Fade in/out 0.3/0.35 s para que el primer y último frame no salten en loop de TV.

```
node scripts/p2-capture-9x16.mjs loop
node scripts/p2-encode-final.mjs loop
```

Beats: amenaza (casa + brasa) → ruta viva demo → rescate 45 ha → QR + `ESCANEÁ Y JUGÁ`.

## Overlays / audio

| Pieza | Origen |
| --- | --- |
| Texto `ESCANEÁ Y JUGÁ` | `docs/video/final/aura-antes-del-humo-loop-16x9-overlay.txt` |
| QR | `public/qr-arcade.png` (producción ya en el repo; no se inventó URL) |
| Audio | silencio AAC |

## ffprobe

- 1920×1080 H.264 + AAC
- duración **13.000 s**

## Framegrabs

`docs/video/final/aura-antes-del-humo-loop-16x9/frame-{1,6,12}s.png`

Revisión: diorama de esta build (monte bajo, casa, estanque, caminos con surcos). Sin chrome de Cursor/DevTools. QR arriba a la derecha en el cierre. El mute queda parcialmente tapado por el QR; el CTA de texto no tapa el predio.

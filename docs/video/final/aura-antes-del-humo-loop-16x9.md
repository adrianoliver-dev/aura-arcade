# aura-antes-del-humo-loop-16x9.mp4

**Commit de la build:** working tree P2 sobre `c36b929` (hash de git al push).
**Archivo:** `public/trailers/final/aura-antes-del-humo-loop-16x9.mp4`

## Captura / edición

- Fuente: frames JPEG de gameplay real de esta build (`?demo=1` en kiosk 1920×1080), canvas a 8 fps, 96 fotogramas en `.tmp-p2/frames/loop/loop-%04d.jpg`.
- `demo=1` sólo para attract, como pide el brief.
- Encoded con ffmpeg gyan.dev 8.1, H.264 + AAC silencio (`anullsrc`), overlays editables.

```
ffmpeg -y -framerate 8 -i .tmp-p2/frames/loop/loop-%04d.jpg -loop 1 -t 13 -i public/qr-arcade.png -f lavfi -t 13 -i anullsrc=channel_layout=stereo:sample_rate=48000 -filter_complex "[0:v]scale=1920:1080,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=12.55:d=0.4[base];[1:v]scale=200:200[qr];[base][qr]overlay=W-228:40:enable='gte(t,9)'[v];[v]drawtext=fontfile='C\:/Windows/Fonts/arialbd.ttf':textfile=docs/video/final/overlay-loop.txt:fontcolor=0xF4E7CF:fontsize=52:x=(w-text_w)/2:y=h-92:enable='gte(t,9)'[out]" -map "[out]" -map 2:a -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest -movflags +faststart public/trailers/final/aura-antes-del-humo-loop-16x9.mp4
```

## Overlays / audio

| Pieza | Origen | Licencia |
| --- | --- | --- |
| Gameplay | build local `http://127.0.0.1:3032/jugar?demo=1` | original Aura |
| Texto `ESCANEÁ Y JUGÁ` | `docs/video/final/overlay-loop.txt` | original |
| QR | `public/qr-arcade.png` (URL de producción ya aprobada, no inventada) | existente |
| Audio | silencio AAC | n/a; SFX del juego no se muxean |

No hay música de librería. No hay video IA.

## ffprobe

- 1920×1080 H.264 + AAC
- duración **13.000 s**
- size ~484 KiB

## Framegrabs

`docs/video/final/aura-antes-del-humo-loop-16x9/frame-{1,6,12}s.png`

Revisión: sin Chrome/Cursor/DevTools/cursor; QR nítido en t≥9; fade in/out para loop; primer y último frame del gameplay son la misma ruta viva (el fade suaviza el corte).

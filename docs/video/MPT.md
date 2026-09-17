# Ensamble MoneyPrinterTurbo

Gameplay real: `public/trailers/loop-raw.mp4`.
No generar el play con el motor de stock de [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo).

MPT (MoviePy + FFmpeg, mismo stack que el topic [video-editing](https://github.com/topics/video-editing)):

```
python vendor/MoneyPrinterTurbo path is c:\AdrianOliver-dev\vendor\MoneyPrinterTurbo
pwsh scripts/cut-trailers.ps1
python scripts/mpt-titles.py
```

`scripts/mpt-titles.py` quema título mute-proof y CTA del QR sobre los tres cortes, usando MoviePy si está instalado, si no FFmpeg.

Salida 2026-09-17:

- `public/trailers/mpt/loop-fexpo-16x9.mp4` (72s, 1920×1080) — AURA ARCADE / Escanea y juga
- `public/trailers/mpt/redes-a-pulso.mp4` (16s, 1080×1920) — PULSO / Toca al ritmo
- `public/trailers/mpt/redes-b-qr.mp4` (16s, 1080×1920) — JUGA GRATIS / Escanea el QR

CapCut pack: `capcut/CAPCUT_EDIT.md`.

Agent-Reach copy de redes: `docs/video/reach-copy.md`.

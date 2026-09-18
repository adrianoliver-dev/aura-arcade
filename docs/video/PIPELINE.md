# Videos Fexpo — pipeline

Gameplay **real** (localhost :3020). No generar el play con IA.

## Repos

- [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) en `c:\AdrianOliver-dev\vendor\MoneyPrinterTurbo` — ensamble, corte, BGM. El play sale de `/reel`, no del generador de stock.
- Topic [video-editing](https://github.com/topics/video-editing) — FFmpeg (gyan.dev 8.1) + recorte 9:16 / 16:9.
- [Agent-Reach](https://github.com/Panniantong/Agent-Reach) — transcribe/reach de los cortes a redes.
- CapCut pack: `capcut/`.

## Tres cortes

1. `public/trailers/loop-fexpo-16x9.mp4` — loop TV, 5 juegos + QR.
2. `public/trailers/redes-a-pulso-humo.mp4` — short 9:16.
3. La variante P3 de RADIO se debe capturar desde la build vigente; no existe un short reutilizable antes de esa captura.

Fuente: `public/trailers/loop-raw.mp4` (gdigrab 480×854).

## Grabar

```powershell
# Chrome --app 480x854 @ 40,40 + pnpm dev :3020
pwsh -File scripts/record-reel.ps1
pwsh -File scripts/cut-trailers.ps1
```

QR last frame: slide `/reel` usa `public/qr-arcade.png` → GitHub del arcade (o `NEXT_PUBLIC_ARCADE_URL`).

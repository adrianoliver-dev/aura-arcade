# Videos Fexpo — pipeline

Gameplay **real** (grabar el stand / localhost :3020). No generar el play con IA.

## Repos

- [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) clonado en `c:\AdrianOliver-dev\vendor\MoneyPrinterTurbo` — ensamble, subs, voz, corte.
- Topic [video-editing](https://github.com/topics/video-editing) — MoviePy / auto-editor / OpenShot si hace falta recorte.
- [Agent-Reach](https://github.com/Panniantong/Agent-Reach) en `c:\AdrianOliver-dev\vendor\Agent-Reach` — reach de clips a redes.
- CapCut pack del repo: `capcut/`.

## Tres cortes

1. **Loop TV** 16:9 — los 5 juegos + QR `/qr` al final (plataforma / GitHub / URL del stand).
2. **Redes A** 9:16 — hook 0–3s, un juego, CTA.
3. **Redes B** 9:16 — otro juego o mix corto.

Material en `public/trailers/` y `docs/playtest/` cuando existan los MP4.

## Grabar

1. `pnpm dev` → http://localhost:3020/reel (gameplay real, 5 juegos + QR)
2. Grabar 68s (Win+G o `ffmpeg -f gdigrab -framerate 30 -t 68 -i desktop public/trailers/loop-raw.mp4`).
3. Recortar highlights para 2 shorts 9:16.
4. MoneyPrinterTurbo / CapCut para títulos mute-proof.
5. QR last frame: ya está en el reel.

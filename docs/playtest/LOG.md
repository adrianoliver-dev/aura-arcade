# Playtest Aura Arcade

Objetivo: ≥30 min por juego. Fallos y parches.

## Sesión 2026-09-17 (balance v2)

- PULSO: 75s + rush 68s. Smoke en hub. Falta 30 min.
- HUMO: 90s / 11 focos. Falta 30 min.
- RADIO: munición 8, HUD con carga, CORTE gastó 8→7 y sumó 21 pts. Falta 30 min.
- MURO: stock 8 + regen. Flood fill ilegal. Ready se limpia al jugar. 1 muro resta stock. Falta 30 min.
- SALIDA: golpe −40, título pueblo ≤3 golpes. Falta 30 min.

Hallazgos cortos:
- Badge Arcade ya no tapa el HUD (pasó a la izquierda).
- Hub con Calor/XP visible.
- `/qr` apunta al repo hasta tener URL de stand (`NEXT_PUBLIC_ARCADE_URL`).
- `/reel` = loop de gameplay real (demo) + QR. HUMO y MURO se vieron bien en mesa.
- Battery 80 seeds: flood MURO no sella el mapa; tank SALIDA nunca es “Sacó al pueblo”; spam RADIO no empata al mixto.

## Sesión UI + reel 2026-09-17 16:10

- HUD unificado (PULSO/HUMO/RADIO/MURO/SALIDA). Barra de tiempo. Ready con anillo.
- QR local `public/qr-arcade.png` (sin qrserver en el stand).
- Hub: calor/XP, CTA JUGÁ, `touch-action: manipulation` (el shell ya no bloquea el tap).
- Reel grabado 72s. Tres cortes en `public/trailers/`.
- Fallo en el take: indicador N de Next.js (dev) aparece en el loop. Apagar `devIndicators` y regrabar en prod.
- Overlay de títulos ya no cubre los botones de RADIO (pasó arriba del HUD).
- Falta playtest de 30 min por juego (battery ≠ mesa).

## Sesión 2026-09-17 16:45 UI + MPT + mesa MURO

- HUD en esquinas (score izq, timer der) + barra de tiempo. Boot con anillo. Ready con CTA 48px. End con chips de rank y CTAs grandes.
- Arcade 4/5 centrado, ya no tapa el score.
- MURO: fuego a 340ms llenaba el mapa en ~4s hasta la casa. SPREAD_MS=720. Copy: anillar la casa, no pintar el lote. Stock 8 = un anillo.
- MPT títulos: `public/trailers/mpt/loop-fexpo-16x9.mp4`, `redes-a-pulso.mp4`, `redes-b-qr.mp4` (FFmpeg drawtext, font Arial Bold local).
- ChatGPT Images: chat `https://chatgpt.com/c/WEB:995d615a-a310-4609-a5a0-353e1f999b5d` still hub (en curso).
- Tests 26/26.

## Sesión 2026-09-17 16:22 mesa

- Hub: `next/link` no navegaba; pasó a `<a href>`. PULSO abre.
- PULSO: ready era `pointer-events: none` (no se podía tapear). Ahora el overlay arranca. Boot “Midiendo el predio”.
- PULSO jugado ~45s: HUD 75s, juice ¡SE METIÓ!/¡DOBLE!, focos suben. Score 0 si hay muchas brechas (penalidad 250).
- RADIO: boot “Sintonizando”, ready táctil, 3 botones 8/8/8. Sin tap se acaba en 0 pts / LÍNEA MUDA / 0 casas.
- RADIO juice TARDE era verde; ahora rojo si falla.
- HUMO: `IndexSizeError` radio negativo en landscape corto; `gridLayout` ya no da cell < 4.
- Demo rematch a los 2.4s del end (20 rondas ≈ 30 min de mesa).
- Regrabando `/reel` sin N de Next.

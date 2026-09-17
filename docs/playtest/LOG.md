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
- Battery 40 seeds: flood MURO no sella el mapa; tank SALIDA nunca es “Sacó al pueblo”; spam RADIO no empata al mixto.

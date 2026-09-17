# Spec — Aura Arcade v2 (Fexpocruz)

Fuente: [spec-kit](https://github.com/github/spec-kit) + evidencia de play (MURO mapa lleno de muros, SALIDA 1370 pts / 59 golpes / título “Sacó al pueblo”, UI placeholder).

## Problema

Los 5 juegos se entienden, pero se sienten demo: tipografía de sistema, CTA “TOCÁ”, HUD que pisa el back, sin safe-area, sin recurso, un round y se acabó. MURO se gana pintando todo. SALIDA premia tankear hits.

## Metas (must)

1. UI mobile HUD (ui-ux-pro-max: 44px touch, 4.5:1, Share Tech Mono, sin emoji-icon, safe-area). Marca Aura: jade `#16B57D`, oro `#F2A021`, ember `#E34B34`, void `#0B0B10`.
2. Round ~90s de acción + **progreso entre partidas** (XP, calor 1–5, misión del día en el hub).
3. MURO: stock de muros + regen lenta. Imposible pintar el grid.
4. RADIO: munición por acción (agua/corte/evacua) + viento.
5. SALIDA: hits duros; títulos altos exigen pocos golpes.
6. HUMO: 90s, más focos.
7. PULSO: ~75–90s, rush tardío.
8. Playtest ≥30 min/juego (log en `docs/playtest/`).
9. 3 videos de **gameplay real**: loop Fexpo+QR, 2 shorts. MoneyPrinterTurbo = ensamble/subs, no genera el play.

## Fuera de alcance

No mezclar con Aura-MVP producción. No video IA del juego.

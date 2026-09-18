# P2 spec — Antes del Humo polish

**Commit base:** `c36b929` (docs P2) sobre `8e2268a`.
**Producto público:** una ronda, 40 s, un pulgar. Sin reabrir cinco juegos.

## Problema

La simulación es jugable. La presentación es una grilla de placeholders: celdas redondeadas, árboles copiados, mar de negro, HUD que no se funde, game feel con `shake: 0` / `flash: 0`, audio de PULSO, ranking con apodos de demo, MP4 de 72 s de la sala vieja.

## Beats (fuente de verdad en `lib/humo/sim.ts`)

| t | Beat |
| --- | --- |
| 0–4 s | Lectura. Base y amenaza visibles. Ghost 1 s y se va. |
| 4–14 s | Casa, ruta ancha. |
| 15–27 s | Estanque, atajo vs seguro, ETA. |
| 28–40 s | Corral, clutch. |

Fallar Casa no cierra Estanque ni Corral.

## Gates (no se cierran con compile)

1. Diorama ≠ mosaico. En 0.5 s se ve origen verde y peligro naranja.
2. Predio 62–72% alto en 390×844; en 1920×1080 domina el encuadre. El cielo/atmósfera explica el resto, no el vacío.
3. Ready vende el juego: foco, base, ghost, CTA sobre el mundo.
4. End: emoción → `OTRA RUTA` visible sin scroll → share → ranking colapsable.
5. Game feel conectado (grab, arrastre, snap, fallo, clutch). Audio propio HUMO.
6. 30 min playtest real con bitácora. Tres MP4 finales con ffprobe.
7. `pnpm test` / `pnpm build` verdes; seed/offline/40 s intactos.

## Fuera de alcance

XP, ligas, claims operacionales, copiar la geografía de `humo-hero-art-direction-v1.png`, video IA como gameplay.

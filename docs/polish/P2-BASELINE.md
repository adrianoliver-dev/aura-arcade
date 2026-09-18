# P2 baseline — commit de partida

**Commit inicial:** `c36b92942c3326b2950841da572ad1f40aaae634` (docs: add P2 production polish gates), sobre `8e2268a`.
**Fecha:** 17 sep 2026.
**Este archivo no es el cierre.** Las capturas de cierre viven en `docs/polish/design-review/`.

## Screenshots de partida (build `8e2268a` / HUD de grilla)

| Archivo | Viewport | Qué muestra |
| --- | --- | --- |
| `docs/polish/baseline/ready-390.png` | pestaña ancha, juego 390 lógico | Ready: predio-isla a la izquierda, mar negro, mosaico de roundRect, botón «Sonido» con texto |
| `docs/polish/baseline/salvado-390.png` | 390×844 | Acierto P1: grilla, banda negra bajo el tablero, instrucción despegada |
| `docs/polish/baseline/end-390.png` | 390×844 | End ALERTA 42 ha, ranking con apodos tipo Guapomo482, overlay opaco |

Los huecos foco/trazo/fallo/attract 1920 se cubren con las mismas fotos de recovery (`docs/playtest/recovery-shots/`) y el MP4 de 72 s de cinco juegos, que **no** califican como producto P2.

## Inventario al partir

| Tipo | Path | Nota |
| --- | --- | --- |
| SVG 1 KB | `public/humo/*.svg` | Placeholders (círculos / rectángulos) |
| Hero SVG | `public/humo/hero-map-diorama.svg` | Mosaico, no diorama |
| Audio | `public/pulso/audio/*.mp3` | Reciclado PULSO |
| QR | `public/qr-arcade.png` | Existe; URL de env, no inventada |
| Trailers | `public/trailers/loop-fexpo-*.mp4` | **72.04 s**, sala de cinco juegos — descartados |
| Art direction | `docs/visual-direction/humo-hero-art-direction-v1.png` | Referencia de jerarquía; no asset ni licencia de geografía |

## Defectos observables (de las fotos, no de teoría)

1. El predio es una grilla de celdas redondeadas y copas-círculo.
2. En landscape el mapa es una islita; el resto es negro sin atmósfera.
3. La instrucción y el CTA viven bajo un vacío, no sobre el mundo.
4. Mute dice «Sonido» en vez de un icono inequívoco.
5. `shake: 0` / `flash: 0` / `shocks` vacíos: el feel está desconectado.
6. End tapa el predio y empuja ranking/alias antes del cuerpo.
7. Los MP4 de 72 s no son este producto.

## Decisión

Reemplazar presentación y feel. Conservar sim determinista, 40 s, offline y anti-cheat.

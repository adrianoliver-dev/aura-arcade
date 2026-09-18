# Research P2 — kiosco, 30–60 s, loop de feria

**Fecha:** 17 sep 2026. **Método:** búsqueda web pública (Agent-Reach/Exa no estaba cableado en esta sesión: `mcporter`/exa no respondió; alternativa WebSearch). Sin cuentas privadas ni datos personales.

## Fuentes

| Fuente | Fecha vista | Claim (del vendor, no auditado) | Uso para Aura |
| --- | --- | --- | --- |
| [ShapeMatch / made for arcade](https://madeforarcade.com/product/interactive-branded-touchscreen-activation/) | 2026-09-17 | Sesión corta, tap to start, kiosk 1080×1920, offline posible, 30–60 jugadores/h | Attract auto-reset; CTA enorme; no pedir identidad para empezar |
| [SpinVault slot](https://spaceengagerslive.com/product/exhibition-slot-machine-game/) | 2026-09-17 | 15–30 s de throughput | 40 s es el techo, no el piso |
| [Tap-in-Time](https://madeforarcade.com/product/whack-a-mole-style-event-game-tap-in-time-personalized/) | 2026-09-17 | 30–60 s, 20–50/h, instrucción instantánea | Ghost de 1 s, no tutorial de párrafo |
| [Troldtekt / Rhombico](https://www.rhombicogames.com/for-businesses/troldtekt/) | 2026-09-18 | Touch + timer en booth; premio después | El payoff es el predio, no un formulario |
| [Shape Match manual](https://madeforarcade.com/manual/shape-match-kiosk-game-user-manual/) | 2026-09-18 | Idle → tap → ronda → score → reset 15 s; 1080×1920 | Attract auto; ranking no bloquea el CTA |
| [PayByPhone / SmartExpo](https://www.smartexpo.co/case-study/paybyphone-perfect-parking) | 2026-09-18 | Puzzle táctil rápido, leaderboard, lead al final | Lead bajo disclosure |
| [Fiberjungle InnoTrade 2025](https://fiberjungle.com/en/portfolio-items/innotrade-2025/) | 2026-09-18 | 30–60 s, souvenir después del score | Share/QR después de `OTRA RUTA` |

## Decisiones accionables

1. El primer frame debe ser jugable a 2 m: fuego + base, sin menú de cinco cards.
2. El loop de TV es 12–15 s, no 72 s de sala.
3. Captura de lead **después** del payoff. Nunca login.
4. Mute-proof: color y forma (verde/naranja/crema) además de audio.
5. Auto-reset del attract; el hero no pide elegir juego.

## MoneyPrinterTurbo / video-editing

MPT genera stock+TTS. Eso **sustituiría** gameplay. Se descarta como fuente de imagen. Uso concreto permitido: quemar captions editables sobre una captura real (ffmpeg `drawtext`, como `scripts/mpt-titles.py` previo) si hace falta. Pipeline elegido: **gameplay de esta build → ffmpeg**. Licencia de overlays: texto original Aura, sin música de librería sin crédito.

## ChatGPT Images / Deep Research

18 sep 2026: el navegador de Cursor tenía ChatGPT logueado. Informe con URLs y decisiones: `docs/polish/research/chatgpt-kiosk-2026-09-18.md`. ChatGPT Images **no** se usó (ni collage ni UI con texto como asset). La dirección de jerarquía sigue siendo `docs/visual-direction/humo-hero-art-direction-v1.png` (referencia, no geografía shipping).

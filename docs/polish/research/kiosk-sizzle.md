# Research P2 — kiosco, 30–60 s, loop de feria

**Fecha:** 17 sep 2026. **Método:** búsqueda web pública (Agent-Reach/Exa no estaba cableado en esta sesión: `mcporter`/exa no respondió; alternativa WebSearch). Sin cuentas privadas ni datos personales.

## Fuentes

| Fuente | Fecha vista | Claim (del vendor, no auditado) | Uso para Aura |
| --- | --- | --- | --- |
| [ShapeMatch / made for arcade](https://madeforarcade.com/product/interactive-branded-touchscreen-activation/) | 2026-09-17 | Sesión corta, tap to start, kiosk 1080×1920, offline posible, 30–60 jugadores/h | Attract auto-reset; CTA enorme; no pedir identidad para empezar |
| [SpinVault slot](https://spaceengagerslive.com/product/exhibition-slot-machine-game/) | 2026-09-17 | 15–30 s de throughput | 40 s es el techo, no el piso |
| [Tap-in-Time](https://madeforarcade.com/product/whack-a-mole-style-event-game-tap-in-time-personalized/) | 2026-09-17 | 30–60 s, 20–50/h, instrucción instantánea | Ghost de 1 s, no tutorial de párrafo |
| [4 in a row kiosk](https://madeforarcade.com/product/4-in-a-row-branded-event-gamification-lead-capture/) | 2026-09-17 | Lead opcional al final | Alias bajo disclosure; WhatsApp no intercepta |

## Decisiones accionables

1. El primer frame debe ser jugable a 2 m: fuego + base, sin menú de cinco cards.
2. El loop de TV es 12–15 s, no 72 s de sala.
3. Captura de lead **después** del payoff. Nunca login.
4. Mute-proof: color y forma (verde/naranja/crema) además de audio.
5. Auto-reset del attract; el hero no pide elegir juego.

## MoneyPrinterTurbo / video-editing

MPT genera stock+TTS. Eso **sustituiría** gameplay. Se descarta como fuente de imagen. Uso concreto permitido: quemar captions editables sobre una captura real (ffmpeg `drawtext`, como `scripts/mpt-titles.py` previo) si hace falta. Pipeline elegido: **gameplay de esta build → ffmpeg**. Licencia de overlays: texto original Aura, sin música de librería sin crédito.

## ChatGPT Images / Deep Research

No se usó collage. La dirección de jerarquía es `docs/visual-direction/humo-hero-art-direction-v1.png` (referencia, no asset). El diorama shipping es canvas original, no esa geografía ni su texto.

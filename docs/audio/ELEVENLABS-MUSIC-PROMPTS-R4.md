# AURA ARCADE — prompts de música para ElevenLabs

Generar **instrumentales originales** en WAV estéreo, 48 kHz, sin voces, sin letras,
sin melodías reconocibles ni samples de música existente. Pedir siempre una versión de
48–55 s con comienzo y final compatibles con loop. No hace falta música por pantalla:

1. `Sala` cubre Sala Aura, ranking y resultados con un mismo tema de identidad.
2. `Gameplay` se genera tres veces, cambiando sólo el perfil final: HUMO, PULSO o RADIO.

El volumen de mezcla objetivo es bajo: la música deja espacio a SFX y a conversación del
stand. La tensión se construye con arreglo y filtro, no con sirenas ni golpes fuertes.

## Prompt 1 — SALA AURA

```text
Original instrumental identity loop for a premium Latin American field-tech arcade: 88 BPM,
subtle 6/8 pulse, warm bombo leguero-inspired low drum, dry hand percussion, airy nylon-string
plucks with a charango-like timbre, soft analog pads, distant night insects made from synthesis,
and a restrained warm sub bass. It must feel nocturnal, optimistic, tactile and sophisticated,
never folkloric pastiche, never cinematic trailer music, never corporate stock music; no vocals,
no spoken words, no whistles, no sirens, no recognizable melody. Make a 52-second seamless loop
with a clean, calm opening and ending, gentle motion throughout, wide but unobtrusive mix that
leaves room for UI sound effects.
```

## Prompt 2 — GAMEPLAY ADAPTATIVO

Copiar el prompt y reemplazar **[PERFIL]** por una de las tres líneas al final. Generarlo tres
veces: una por juego.

```text
Original interactive-game instrumental, exactly 52 seconds, loop-safe start and ending, no vocals,
no lyrics, no spoken samples, no melody recognisable from any song or film. Start clear and focused;
build pressure in the final third by adding rhythm, low-pass movement and a little harmonic tension,
then give a clean release in the last two seconds so the loop can restart. Keep the mix mobile-safe:
strong low-mid rhythm, sparse high frequencies, ample gaps for tactile UI SFX; no EDM drop, no generic
epic trailer swell, no police/emergency siren, no horror drones. The sound should feel rooted in a
contemporary Santa Cruz night through hand-played texture and air, but it must be modern and original.

[PERFIL]
```

Perfiles para sustituir literalmente:

```text
HUMO PROFILE: 90 BPM, slow 6/8 forward motion, muted bombo, brushed wood, breathy plucked nylon,
low warm pad and a controlled ember-like granular texture. The final third becomes urgent through
denser hand percussion and filtered bass, never panic.
```

```text
PULSO PROFILE: 112 BPM, precise dry wood clicks, tight hand percussion, rubbery sub pulse and brief
bright plucked accents. The final third doubles perceived energy using syncopation and tiny pauses;
it must reward timing, feel athletic and playful, not like an arcade casino.
```

```text
RADIO PROFILE: 96 BPM, low muted tom heartbeat, sparse metal rim taps, warm bass pulse, very subtle
shortwave texture and a single plucked nylon note family. The final third tightens the heartbeat and
filter motion to make decisions feel urgent; no static bursts, alarms or militaristic sounds.
```

## Entrega e integración

- Nombrar los WAV: `sala-loop.wav`, `humo-loop.wav`, `pulso-loop.wav`, `radio-loop.wav`.
- Mandar el WAV elegido de cada familia; se normaliza, se transcodifica y se integra con controles de
  volumen, mute y reducción de movimiento. No se sube un audio sin probar loop, móvil y monitor.
- Los seis SFX de RADIO ya están en el flow privado de ElevenLabs. Elegir una variante de alerta,
  acierto y presión antes de exportarlos; no usar los URLs temporales de previsualización en producción.

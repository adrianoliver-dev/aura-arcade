# AURA ARCADE — recovery log

Zona: America/La_Paz. Stand Fexpocruz 2026.

## Fase 0 — auditoría (antes de editar producto)

| Check | Resultado | Evidencia |
| --- | --- | --- |
| `git status --short` | limpio (HEAD `c79e2ba`) | working tree vacío al inicio |
| `pnpm install --frozen-lockfile` | OK, 1.6s | lockfile al día, Next 16.3.5 |
| `pnpm test` | 26/26 pass, 1.87s | duración hero aún **90_000 ms** (P0 de producto) |
| `pnpm build` | OK, webpack 13.7s + TS 5.8s | 13 rutas; no existía `/api/humo/*` |
| Producto público | 5 cards + copy “90 segundos” | `app/page.tsx`, `app/layout.tsx` |
| HUMO ranking | mezcla start/finish de `/api/pulso` | `components/humo/humo-game.tsx` |
| Dirección visual | Space Tech / mono HUD | `app/globals.css`, `MASTER.md` (descartado) |

### Bugs de auditoría y cierre

| ID | Sev | Ruta | Repro | Causa | Fix | Verificación |
| --- | --- | --- | --- | --- | --- | --- |
| R0-1 | P0 | `/` | Abrir stand | Hub de cinco juegos | Landing 1 CTA `JUGÁ 40 S` | 307 no aplica; `/` 200, un link |
| R0-2 | P0 | `/jugar` | Jugar HUMO | MATCH 90s, 11 focos, XP | `MATCH_MS=40000`, 3 incidentes | tests recovery + ronda 42 ha |
| R0-3 | P0 | HUMO finish | Ranking | Token/API de PULSO | `/api/humo/*` | start 200 `matchMs:40000` |
| R0-4 | P1 | HUD | Viewport | Grid sci-fi | paleta diorama, HUD 1 tarjeta | `acierto-390.png` |
| R0-5 | P1 | boot | API lenta | fetch sin timeout | 2.5s abort + seed local | `fetch-timeout.test.ts` |
| R1-1 | P1 | end | 390×844 | Revancha bajo el fold | CTA `Otra ruta` arriba | end-screen reorder |
| R1-2 | P2 | `/jugar` | Dev overlay | Hydration mute/localStorage | `isPulsoMuted` simétrico | overlay no en prod |

---

## Decisiones de dirección

- Un solo hero público: **AURA: ANTES DEL HUMO — Ruta de escape**.
- PULSO = attract 10–15 s (`/loop`). RADIO / MURO / SALIDA = `/lab/*` no indexado.
- Fuente de verdad: `lib/humo/sim.ts` (40_000 ms, seed del día, ha, medal, anti-cheat).
- Metáfora jugable: sin claims de minutos reales, hectáreas operativas ni eficacia Aura.
- ChatGPT Images: no KEEP en este corte. Assets vectoriales propios en `public/humo/*.svg` (sin texto, sin marcas). Tradeoff: no retrasar el hero por un collage.

---

## Playtest hero (sesiones reales, no battery de seeds)

Hora local 17-sep-2026 ~19:15–19:25 America/La_Paz. Servidor `http://127.0.0.1:3032`.

| Hora | Escenario | Qué pasó | Decisión | Evidencia |
| --- | --- | --- | --- | --- |
| 19:18 | boot | “Cargando predio” < 1.5 s → ready | timeout 1200 ms | innerText ready + CTA |
| 19:19 | ready 390 | Diorama + base verde + CTA | paleta brief | canvas ready |
| 19:20 | principiante / tarde | Primer foco se quema si no se traza a tiempo | juice `SE QUEMÓ`, no shake de pantalla | timer 22, 0 ha |
| 19:22 | acierto una mano | Trazo base → casa, 42 ha | snap + ETA; vegetación recupera | `recovery-shots/acierto-390.png` |
| 19:23 | clutch / error | Focos 2–3 perdidos por llegar tarde | ALERTA 1/3 rutas, ranking 1° | `recovery-shots/end-alerta-390.png` |
| 19:23 | resultado | Alias opcional; faltaba revancha visible | CTA rematch arriba | end-screen |
| 19:24 | QR → juego | `/qr` CTA único; `/humo` 307 → `/jugar` | redirects | curl 307/200 |
| 19:24 | lab | `/lab` noindex, prototipos | fuera del stand | snapshot lab |
| 19:24 | sin audio | botón Sonido opt-in | default mute-safe | HUD |
| — | 30 min continuos mesa | No se simuló con 80 seeds. Quedan rondas de stand mañana | repetir en kiosk 1080 | — |

No quedan P0 abiertos de comprensión (fuego, base verde, trazo, hectáreas). P1 de rematch bajo el fold cerrado en código.

---

## Gates

| Gate | Estado | Evidencia |
| --- | --- | --- |
| `pnpm test` | verde, 34 tests | 40s, guía válida, 3 corredores, 120 seeds, timeout |
| `pnpm build` | verde | `/`, `/jugar`, `/api/humo/*`, `/lab` |
| Landing 1 CTA | sí | `/` |
| Hero 40 s / 3 incidentes | sí | `lib/humo/sim.ts` |
| Offline/timeout no bloquea ready | sí | `BOOT_BUDGET_MS` + seed local |
| Stills ChatGPT | no KEEP; SVG propio | `public/humo/*.svg` |
| Loop 15 s + shorts | comando listo, no grabar toma sucia | `docs/video/RECOVERY-CAPTURE.md` |

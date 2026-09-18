# Cursor mega prompt — P4 video final para Fexpocruz

Pegá desde la raíz `C:\AdrianOliver-dev\Aura\aura-arcade`. Este es trabajo de dirección, captura, edición y QA; no una tarea de “generar tres MP4” a partir de screenshots.

---

Actuá como **director creativo, editor de gameplay, diseñador de sonido y responsable de QA de entrega** para el material audiovisual final de AURA ARCADE en Fexpocruz. Trabajá de manera autónoma y sostenida: inspeccioná el producto vigente, capturá gameplay real, descartá las tomas débiles y no declares el trabajo listo por tener archivos MP4 o porque `pnpm build` pase.

## Fuente de verdad y límites

- Trabajá sobre `main` en el commit actual o posterior a `ea97317`. Antes de editar, registrá el SHA con `git rev-parse HEAD`.
- El producto vigente es un trío: **ANTES DEL HUMO**, **PULSO** y **RADIO ROJA**. MURO y SALIDA están retirados; no pueden aparecer ni por un frame, ni como imagen, ni como texto, ni en scripts de captura.
- Leé primero `docs/P3-TRIO-SCOPE.md`, `docs/P3-INTERACTION-REPAIR.md`, `docs/OFFICIAL-LAUNCH-HANDOFF.md`, `docs/video/P4-TRILOGY-CAPTURE-BRIEF.md`, `docs/stand/P4-FEXPO-LAUNCH-KIT.md` y `docs/video/final/STALE-AFTER-P3.md`.
- Todo MP4 dentro de `public/trailers/`, `public/trailers/mpt/` y `public/trailers/final/` es **histórico y rechazado**. No lo reexportes, no lo cortes, no lo uses de B-roll y no lo llames final.
- `docs/playtest/sessions.jsonl` pertenece al usuario. Nunca lo borres, resetees, modifiques ni incluyas en un commit.
- No inventes una URL pública. Si aún no está desplegada, capturá contra el build de producción local y dejá claramente el QR/endcard pendiente de la URL final; cuando exista el dominio, rebuild y reexport obligatorio.

## Resultado que debe provocar

En un monitor de feria, a dos metros y sin audio, una persona entiende en menos de tres segundos: “hay un fuego, puedo jugar una respuesta, es rápido y escaneo para entrar”. Con audio, debe sentirse como tierra roja, monte nocturno, brasa y pulso humano: elegante, con energía, no como trailer de plantilla, videojuego cyberpunk o música stock genérica.

La pieza vende una emoción y una acción, no una lista de features. El juego sigue siendo una metáfora: no afirmar hectáreas reales, minutos de anticipación ni resultados operativos que Aura no haya probado públicamente.

## Preflight obligatorio

1. Ejecutá `git status --short`; conservá cambios ajenos.
2. Ejecutá `pnpm test` y un build de producción aislado. Si modificás código, repetí ambos antes de capturar.
3. Abrí el build de producción sin chrome, DevTools ni indicador de Next, en 1920×1080 y 390×844.
4. Jugá manualmente, no solo con robots, hasta conseguir:
   - HUMO: base verde → aro `SOLTÁ AQUÍ` → foco apagado y hectáreas visibles;
   - PULSO: señal `¡AHORA!` seguida por un acierto inequívoco y racha/feedback;
   - RADIO: pista legible, elección correcta y reacción de casa/racha.
5. Si una acción no se comprende o no se puede ejecutar limpiamente, **no la tapes editando**. Documentá el bug, arreglalo con una prueba reproducible, y recapturá.
6. Confirmá que la variable `NEXT_PUBLIC_ARCADE_URL` sea el dominio oficial antes del export que contiene QR. El QR debe abrir `/jugar` desde un teléfono con datos móviles.

## Dirección visual: precisa, no genérica

- Usá solamente el gameplay y arte reales del build vigente. Podés crear placas tipográficas, máscaras de humo y transiciones abstractas originales, pero nunca UI falsa, mapas IA, árboles de stock, incendios de banco de imágenes, dedos generados o screenshots de otro build.
- Paleta: tierra roja/ocre, verde profundo, agua azul apagada, brasa naranja y crema Aura. Negro solo para respirar entre golpes, no como fondo vacío permanente.
- Tipografía: la que ya usa el producto o una extensión claramente compatible. Pocas palabras, enormes, alto contraste. Nada de párrafos, letras finas o captions minúsculos.
- La edición une juegos por **match cuts**: brasa/foco de HUMO → aro de PULSO; resplandor naranja → señal de RADIO; no por transiciones de plantilla, glitches o barridos sin motivo.
- Todo título debe sobrevivir en silencio. El QR vive únicamente en la endcard y jamás tapa mute, instrucción, puntaje o gesto.
- No usar logos ajenos, fotos de emergencia real, sirenas institucionales ni música comercial.

## Sonido: obligatorio y con identidad

- Conservá los sonidos reales del juego cuando se capturen. Si el capturador no registra Web Audio, mezclá desde las fuentes originales del repositorio, respetando el momento exacto de cada evento; no sustituyas con un AAC silencioso.
- Diseñá una cama original de 6/8 sobria: 92–100 BPM, percusión seca discreta, plucks/rasgueo abstracto y aire nocturno. Debe remitir sutilmente al oriente boliviano sin imitar una canción, artista o grabación tradicional concreta.
- El acierto, la ruta salvada y la decisión correcta deben sobresalir de la cama; errores tienen tensión corta, nunca sonidos humillantes. Dejá respiración antes de la endcard.
- Entregá mezcla estéreo 48 kHz; verificar auriculares, parlante pequeño y monitor. Objetivo: diálogo inexistente, música debajo de SFX, true peak <= -1 dB. No normalizar hasta distorsionar.
- Si se generan o licencian nuevos sonidos, guardar prompt/origen/licencia y archivos fuente. Sin música de YouTube, TikTok, Spotify, bancos sin licencia o “folk free” sin trazabilidad.

## Entregables exactos

Crear `public/trailers/p4/` y producir exactamente estos másters:

| Archivo | Entrega | Especificación |
| --- | --- | --- |
| `aura-arcade-fexpo-loop-16x9.mp4` | Monitor principal | 18.0 s, 1920×1080, 60 fps CFR, H.264 High/yuv420p, AAC estéreo 48 kHz. |
| `aura-arcade-clutch-9x16.mp4` | Red social: jugada | 12.0 s, 1080×1920, 60 fps CFR, H.264 High/yuv420p, AAC estéreo 48 kHz. |
| `aura-arcade-trio-9x16.mp4` | Red social: tres retos | 15.0 s, 1080×1920, 60 fps CFR, H.264 High/yuv420p, AAC estéreo 48 kHz. |
| `aura-arcade-fexpo-loop-16x9-monitor-safe.mp4` | Respaldo de feria | Mismo contenido, H.264 ampliamente compatible, probado en el monitor real. |

Crear también `docs/video/p4/` con un manifiesto por export y framegrabs. Conservar raw fuera de `public/` si son grandes; versionar solo lo necesario y documentar dónde se recrean.

## Storyboard no negociable

### 1. Loop de monitor, 18 s, 16:9

| Tiempo | Acción real en pantalla | Texto de apoyo |
| --- | --- | --- |
| 0.0–1.5 | Predio HUMO, foco naranja late y la casa está en riesgo. | `¿LLEGÁS ANTES DEL HUMO?` |
| 1.5–5.5   | Un único trazo limpio sale de `BASE`, llega a `SOLTÁ AQUÍ`, feedback `LLEGÓ`; el foco se apaga. | `TRAZÁ LA RESPUESTA` |
| 5.5–7.5 | Payoff físico: predio salvado y hectáreas/medalla legibles. | `PROTEGÉ EL PREDIO` |
| 7.5–10.8 | Match cut a PULSO: aro y brasa coinciden, toque correcto, racha responde. | `TOCÁ JUSTO` |
| 10.8–14.0 | Match cut a RADIO: pista visible, decisión correcta, la casa queda a salvo. | `DECIDÍ RÁPIDO` |
| 14.0–18.0 | Endcard silenciosa y estable: QR grande, dominio, CTA. | `AURA ARCADE · ESCANEÁ Y JUGÁ` |

El inicio y final deben enlazar mediante brasa/humo/paleta, no por corte negro. El QR mide al menos 240 px de alto en 1080p, tiene quiet zone blanco y se prueba a 1 y 1.5 m.

### 2. Short `clutch`, 12 s, 9:16

- 0.0–1.8: foco junto a la casa; tensión visual, sin explicación larga.
- 1.8–6.5: gesto real base → aro; camino claro, `LLEGÓ`, foco apagado.
- 6.5–9.5: recompensa emocional y resultado legible; sin formulario ni ranking tapando el mapa.
- 9.5–12.0: `¿ME GANÁS?` + dominio. QR opcional solo si conserva aire.

### 3. Short `trío`, 15 s, 9:16

- 0.0–5.0: HUMO, gesto y apagado claros.
- 5.0–9.0: PULSO, `¡AHORA!` seguido de acierto, nunca un miss.
- 9.0–12.0: RADIO, pista → decisión correcta → casa protegida.
- 12.0–15.0: marca, QR y CTA. El título no compite con el gameplay.

## Captura y edición reproducibles

1. Capturá a 60 fps con la ventana/producto en fullscreen sin marco. No grabes el navegador y luego recortes una barra: la toma debe nacer limpia.
2. Guardá una lista de seeds, rutas y acciones de las tomas elegidas. La jugada debe poder repetirse.
3. Hacé una primera edición, revisala al 100%, 50% y 25% de tamaño. Si no se entiende al 25%, rehacer jerarquía, no agrandar todo a último minuto.
4. Extraé imágenes en 0, 1.5, 5.5, 8, 11, 14, 16 y último segundo del loop; 0, 2, 6, 9 y último de cada vertical.
5. Ejecutá `ffprobe` para dimensión, duración, fps, códec y streams. Escuchá un mínimo de 10 s de cada export en auriculares y parlante.
6. Revisá el loop tres veces seguidas: no puede tener salto duro, frame negro, audio clickeado, QR borroso, cursor, tearing ni UI que contradiga lo que muestra.
7. Probalo en el monitor físico mediante el archivo `monitor-safe`, con reproducción local en loop, no desde un navegador dependiente de Wi‑Fi.

## Evidencia a entregar

Para cada MP4 crear `docs/video/p4/<nombre>.md` con:

- SHA y URL del build capturado;
- duración/dimensiones/fps/códecs completos de `ffprobe`;
- comando de captura, comando de edición/export y fuentes de audio;
- framegrabs indicados arriba;
- resultado de escaneo QR en teléfono;
- revisión de audio, loop y monitor;
- defectos hallados, qué se corrigió y qué límite sigue abierto.

Además, actualizar una hoja única `docs/video/p4/REVIEW.md` con tabla de aceptación/rechazo. No afirmes “video final” sin evidencia de cada fila.

## Rechazo automático

Descartá y rehacé cualquier clip que tenga uno de estos fallos:

- captura vieja, MURO/SALIDA, UI de otro build o gameplay fingido;
- cursor, chrome, DevTools, loading, overlay de grabación, lag o letra ilegible;
- garabatos en HUMO, foco que no se apaga, hit de PULSO que parece fallo o decisión RADIO sin causa;
- QR que no abre la URL final o tapa controles/instrucciones;
- audio mudo, música sin licencia, mezcla que ahoga feedback o efecto genérico sin relación con acción;
- transiciones de template, clips de stock, imágenes IA con texto, datos falsos o promesas operativas no validadas;
- duración incorrecta, fps variable, loop con salto evidente o export sin test en monitor.

## Cierre y Git

- Hacer commits atómicos: primero scripts/documentación de captura, después los assets aprobados. No mezclar cambios ajenos.
- Nunca incluir `.env`, `.data`, secretos ni `docs/playtest/sessions.jsonl`.
- Ejecutar `pnpm test`, build, `git diff --check` y luego push a `origin/main`.
- La respuesta final debe contener: SHA, archivos producidos, rutas, resultado exacto de tests/build/ffprobe, qué se jugó manualmente, cómo se verificó QR/audio/monitor y limitaciones reales. No uses “increíble”, “viral”, “final” o “terminado” sin demostrarlo.

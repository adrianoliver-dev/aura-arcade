# CURSOR — AURA ARCADE P2: POLISH REAL, NO "VERDE" DE MENTIRA

## Mandato

Trabajá de corrido en `C:\AdrianOliver-dev\Aura\aura-arcade`, sobre `main` en el commit que exista al empezar. No abras cinco juegos ni cambies el producto público: sigue siendo **AURA: ANTES DEL HUMO**, una única ronda de 40 segundos y una ruta con el pulgar. No declares terminado por `pnpm test`, `pnpm build`, una captura estática o un archivo con comandos pendientes. El único cierre aceptable es código, assets, tres MP4 finales y evidencia de QA real en el repositorio, todo empujado a GitHub.

El corte `8e2268a` arregló estructura, duración y tolerancia offline. No llegó al estándar visual, táctil ni audiovisual. Tomá esta frase literalmente: **no maquilles el canvas actual; reemplazá la presentación y el game feel hasta que deje de parecer una grilla de placeholders.** Conservá las reglas deterministas/anti-cheat que funcionan sólo cuando no contradigan este documento.

No preguntes al usuario. Si una herramienta falla, documentá el fallo, usá una alternativa local segura y seguí. No inventes pruebas ni digas "jugado 30 min" sin la bitácora, video o capturas que lo demuestren.

## Antes de tocar código: evidencia de partida

Leé y mirá, no sólo nombres de archivos:

- `docs/ARCADE-RECOVERY-BRIEF.md`
- `docs/playtest/RECOVERY-LOG.md`
- `docs/playtest/recovery-shots/acierto-390.png`
- `docs/playtest/recovery-shots/end-alerta-390.png`
- `docs/visual-direction/humo-hero-art-direction-v1.png`
- `components/humo/humo-game.tsx`, `humo-fx.ts`, `humo-end-screen.tsx`, `lib/humo/sim.ts`
- los MP4 actuales de `public/trailers/`.

La imagen `humo-hero-art-direction-v1.png` es una **referencia de jerarquía, materialidad y ocupación de pantalla**; no es un asset final ni una licencia para copiar su geografía, su texto o sus marcas. La Chiquitanía se interpreta con honestidad: predio, caminos de tierra, monte bajo, estanque, casa y corral; no con selva genérica ni tech-space UI.

Creá `docs/polish/P2-BASELINE.md` con: commit inicial, 6 screenshots propios (390×844: ready, foco 1, trazo, salvado, fallo, end; 1920×1080: attract y gameplay), inventario de assets/audio/video, y una lista corta de defects observables. Este baseline no es el cierre.

## El estándar que hay que alcanzar

La sensación es: *un predio vivo al anochecer está en riesgo; mi dedo puede abrir una respuesta antes de que llegue el humo*. Es una metáfora, no una promesa de predicción ni de hectáreas reales de Aura.

Debe verse como una micro-experiencia premium de museo/stand, no como un dashboard, un juego de cuadrícula, pixel art ni un demo técnico:

- El predio usa 62–72% de la altura útil de un teléfono 390×844 y es la estrella. En kiosk 1920×1080 debe dominar el encuadre, no quedar como una islita dentro de negro.
- No puede haber bandas negras vacías enormes entre tablero, instrucción y CTA. Cada zona debe tener una razón: atmósfera, juego o decisión.
- Nada de mosaicos repetidos, círculos/copias de árboles, rectángulos redondeados como terreno, bordes de debug, tipografía pseudo-retro ilegible, o colores fosforescentes sin significado.
- UI silenciosa: una tarjeta de tiempo/resultado, un icono de sonido inequívoco, una instrucción contextual. Sin copiar el HUD de PULSO y sin hacer al usuario leer una ficha técnica.
- Alta jerarquía de color: verde Aura = origen/respuesta/éxito; naranja/brasa = peligro; crema = información humana. No agregues una cuarta paleta protagonista.
- Diseñá para sol, ruido, una mano, gente pasando y pantallas de distinta relación. Objetivo táctil mínimo 48 CSS px, textos críticos grandes y contraste suficiente.

## Arte y composición: entrega real, no SVG de 1 KB

1. Diseñá un diorama de lectura inmediata y con capas: suelo y surcos, caminos con textura, copas irregulares, agua con reflejo, humo que deriva, fuego con borde y brasas, casa/estanque/corral con siluetas inconfundibles. En 0.5 s se entiende dónde empieza la respuesta y dónde está el peligro.
2. Podés elegir Canvas, sprites raster propios, SVG ilustrado de verdad o una combinación eficiente; el resultado no puede depender de un fondo genérico de IA ni de formas repetidas. Si usás arte generado, pasá revisión humana visual, integralo de forma no destructiva, documentá licencia/origen y no permitas texto generado dentro de assets.
3. Construí una capa ambiental con parallax/animación sutil: humo, viento, luz de brasa y agua. Todo debe respetar `prefers-reduced-motion` y mantener 50–60 fps en móvil medio.
4. Remplazá la pantalla de ready por una entrada que ya venda el juego: primer foco visible, base respirando, una sola flecha/ghost route y CTA que se funde con el mundo. Nunca pongas la instrucción debajo de un vacío negro.
5. Para el end, el predio queda detrás como testigo de lo que se salvó/perdió. La recompensa llega antes que el ranking; el botón de revancha nunca queda bajo el fold. El alias/ranking es secundario y colapsable.

Generá y revisá al menos estas imágenes de diseño en `docs/polish/design-review/`, sin collage:

- `ready-390.png`, `action-390.png`, `save-390.png`, `end-win-390.png`, `end-miss-390.png`
- `gameplay-1920x1080.png`, `attract-1920x1080.png`

No continúes a video hasta que cada una se vea como una pieza terminada sin tener que explicarla con texto.

## FTUE, balance y progresión dentro de 40 s

La primera persona que llega debe hacer una acción comprensible antes del segundo 7. La ronda tiene tres pulsos, no tres botones ni un puzzle de precisión arbitraria:

| Tiempo | Beat | Intención | Resultado emocional |
| --- | --- | --- | --- |
| 0–4 s | calor y lectura | base verde y amenaza se ven; ghost route de 1 s, desaparece | "sé qué hacer" |
| 4–14 s | Casa | ruta amplia y perdonadora; primer éxito posible para un novato | "lo hice" |
| 15–27 s | Estanque | ruta con elección expresiva: atajo rápido que atraviesa humo o vuelta segura; feedback ETA legible | "puedo mejorar" |
| 28–40 s | Corral | presión alta, una ventana de clutch generosa, feedback grande | "una más" |

Reglas de balance obligatorias:

- Fallar Casa no hace inútiles Estanque ni Corral. Siempre queda una ruta digna de remontada y un final que invita a revancha.
- El input nace sólo si toca/casi toca el ancla verde; captura con imán claro y perdona pequeños desvíos. Al llegar, captura al foco naranja con feedback antes de soltar.
- El jugador elige trayectoria o timing con consecuencias entendibles. No puede ganar dibujando un garabato largo, ni perder por un pixel o por una ruta oculta.
- El ETA no es una cifra técnica: es una cápsula pegada a la punta de la ruta con estados `LLEGA`, `JUSTO`, `TARDE` y color/forma, visible mientras arrastra.
- Score: recompensá rescate, llegada temprana y calidad de ruta. Explicá en una línea el porqué de cada resultado; no muestres estadísticas que no ayuden a jugar otra vez.
- Sumá progresión efímera y honesta: mejor personal del día + fantasma/objetivo a superar en la revancha. No construyas un metajuego de XP, ni claims operacionales, ni login.
- La derrota debe ser dramática y corta: un foco se consume, la ruta se retrae, audio cae, y el end muestra “te quedó una ruta” o equivalente. No es aceptable terminar con una lista de nombres antes de sentir el desenlace.

## Game feel: implementar, no dejar parámetros muertos

El código actual pasa `shake: 0`, `flash: 0` y no alimenta `shocks`. Eso significa que no hay impacto aunque existan tipos/funciones. Eliminá los parámetros muertos o, preferiblemente, conectalos a eventos reales y probalos.

Para cada interacción, implementá una secuencia concreta y moderada:

1. **Down en base:** captura visual magnética, tick táctil opcional (`navigator.vibrate` sólo cuando esté disponible), halo que contrae 1 vez.
2. **Arrastre:** cinta de respuesta con punta viva, pequeños hit-ticks espaciados por distancia — no un beep por frame —, ghost cells y ETA que cambia sin lag.
3. **Soltar válido:** snap final de 120–180 ms, onda radial, partículas de polvo/agua/verde según foco, contador de ha que cuenta arriba, y 1 shake local del predio (no una sacudida que cause mareo).
4. **Tarde/fallo:** humo gana terreno, impacto naranja breve, sonido descendente, mensaje contextual de máximo dos palabras. Nunca tapar el input con un modal.
5. **Clutch:** compresión leve de audio, viento/humo, pulso de borde y liberación satisfactoria si se salva.

Cada evento debe tener límite de frecuencia y ser seguro con mute, touch, teclado y reduced-motion. Los efectos y audio no pueden ser archivos reciclados llamados `pulso`; creá un mapa sonoro propio de HUMO con nombres, créditos/licencias y mezcla coherente. La música ambiente debe ser opcional y más baja que SFX. Probá en altavoces de laptop y teléfono; el juego debe seguir siendo inteligible en mute.

## UX de resultado, ranking y captura de lead

- El orden obligatorio: resultado emocional → CTA `OTRA RUTA` → desafío compartible → ranking/alias bajo un disclosure. En 390×844, `OTRA RUTA` debe estar enteramente visible sin scroll.
- Sustituí nombres automáticos que parecen datos de demo por una presentación sobria. Si no hay ranking de red, decí claramente “sin conexión; tu mejor ronda sigue acá”, no fabriques una clasificación competitiva.
- WhatsApp es secundario y no debe interceptar el final. Cualquier share usa texto que no haga promesas de prevención real.
- En el stand, el QR está en una superficie visible de la landing/attract/end. Debe poder escanearse a 1 m: alto contraste, quiet zone y URL de producción aprobada. No inventes una URL.

## Attract y tres videos finales

Los MP4 actuales de 72.04 s son de la sala de cinco juegos y no califican para el nuevo producto. No los declares finales ni los reutilices como evidencia.

Grabá gameplay real de **esta** build, sin Chrome/Cursor/DevTools/cursor del mouse. Usá `?demo=1` sólo para attract; las jugadas sociales deben ser trazos humanos registrados. Hacé el acabado en editor o ffmpeg con overlays de texto editables, no video IA sustituyendo gameplay.

Entregables bajo `public/trailers/final/`:

| Archivo | Formato | Duración | Beats obligatorios |
| --- | --- | --- | --- |
| `aura-antes-del-humo-loop-16x9.mp4` | 1920×1080, H.264, audio AAC | 12–15 s, loop real | amenaza → ruta viva → rescate → QR + `ESCANEÁ Y JUGÁ`; primer/último frame compatibles |
| `aura-antes-del-humo-clutch-9x16.mp4` | 1080×1920, H.264, audio AAC | 10–14 s | 1 s de peligro, trazo humano, snap/impacto, resultado, CTA corto |
| `aura-antes-del-humo-revancha-9x16.mp4` | 1080×1920, H.264, audio AAC | 10–14 s | falla cercana → “OTRA RUTA” → clutch → score / QR |

Para cada video guardá: `docs/video/final/<nombre>.md` con commit, comando de captura/edición, fuente de cada overlay/audio, `ffprobe`, duración comprobada y 3 framegrabs. Revisá el video cuadro a cuadro: sin chrome, cursor, tearing, texto generado mal, QR borroso, loops con salto, música sin licencia o gameplay que no coincide con el producto.

## Herramientas y research solicitados

Usá los repos pedidos con finalidad verificable, no como decoración ni dependencia inútil:

1. `github/spec-kit`: escribí la spec/gates P2 antes de la gran reescritura y conservá los artefactos útiles en `docs/polish/spec/`.
2. `nextlevelbuilder/ui-ux-pro-max-skill`: usalo para el audit de jerarquía, touch, tipografía y contraste; volcalo en `docs/polish/UI-UX-AUDIT.md` con decisiones aplicadas, no un dump de consejos.
3. `Panniantong/Agent-Reach`: investigación de referencias públicas de booth/mobile/sizzle, con fuentes y notas en `docs/polish/research/`. No uses cuentas privadas, scraping no permitido ni datos personales.
4. `harry0703/MoneyPrinterTurbo` y la colección `github.com/topics/video-editing`: evaluá y documentá un uso concreto de automatización de captions/cutting o decidí con evidencia por qué el pipeline local reproducible es mejor. El video final nunca puede ser una alucinación IA en lugar de la build jugable.

Si hay que instalar algo, verificá licencia, mantenimiento, tamaño y reversión antes. No metas binarios enormes ni secretos en Git. Si una herramienta no es compatible, dejá una alternativa reproducible y seguí con la producción.

Además, cuando el navegador de Cursor tenga ChatGPT logueado, hacé una investigación profunda de referencias de kioscos, juego móvil de 30–60 s, UX táctil, game feel y video loop para ferias. Guardá el informe con URLs, fechas, claims y decisiones accionables en `docs/polish/research/`. ChatGPT Images sólo puede usarse en un loop dirigido de arte: una imagen por envío, referencias correctas, revisión visual y assets finales versionados. Nunca uses un collage ni una UI AI con texto como asset shipping.

## QA: gates que no se negocian

No cierres P2 hasta que todos estén demostrados:

- [ ] `pnpm test` y `pnpm build` verdes; las reglas de seed, offline, duración 40 s y server/client permanecen deterministas.
- [ ] QA visual manual de ready/action/save/miss/end en 390×844 y 1920×1080, con capturas reales en `docs/polish/design-review/`.
- [ ] Cada captura pasa estas preguntas sin explicación: ¿sé qué tocar?, ¿veo el foco?, ¿la ruta llena el encuadre?, ¿hay una razón visual para el espacio?, ¿el CTA cabe?, ¿esto parece terminado?
- [ ] Prueba real de al menos 30 minutos por variantes críticas: novato, experto, fallo temprano/remontada, offline, mute, landscape/kiosk, reduced motion. Registrá duración, build hash, dispositivo/viewport, hallazgo, fix y nueva prueba en `docs/playtest/P2-PLAYTEST-LOG.md`. Una batería de seeds no cuenta como esos 30 min.
- [ ] No quedan parámetros de game feel desconectados, efectos falsos ni TODOs/P0/P1 escondidos. Hacé búsqueda explícita y documentá lo resuelto.
- [ ] Tres MP4 finales existen, tienen duración/formato correctos por `ffprobe`, muestran la build final y tienen framegrabs revisados.
- [ ] `git status --short` limpio. Commit(s) atómicos, descriptivos y push a `origin/main`. El informe final cita hashes, paths, comandos ejecutados, duración real de playtest y los defectos que razonablemente sigan abiertos.

La frase "completado" queda prohibida si falta un MP4, una captura QA, la bitácora de 30 minutos, una revisión visual genuina o un push. Si una parte no se pudo hacer, decilo primero con evidencia y seguí con lo restante; no la conviertas en una instrucción para que otra persona la haga.

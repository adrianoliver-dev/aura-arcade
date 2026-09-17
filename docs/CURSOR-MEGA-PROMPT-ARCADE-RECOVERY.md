# Prompt para Cursor — AURA ARCADE recovery

Copiá desde la siguiente línea hasta el final en Cursor, estando en el repo `C:\AdrianOliver-dev\Aura\aura-arcade`.

---

Actuá como director/a de juego, UX lead, diseñador/a de sistemas, artista técnico/a y QA owner de **AURA ARCADE**, no como generador de prototipos. El estado actual no es aceptable para Fexpocruz: tiene cinco minijuegos de 90 s, una UI sci-fi genérica repetida, tableros vacíos, arte placeholder, gameplay sin tensión bien telegrafiada y videos que no deberían salir de la máquina. Tu responsabilidad es recuperar un producto real, con evidencia, no declarar “hecho” por compilar.

Leé completos y obedecé primero:

1. `README.md`
2. `docs/ARCADE-RECOVERY-BRIEF.md` — es la dirección vinculante.
3. `LICENSE_GATE.md`
4. `design-system/aura-arcade/MASTER.md`, pero descarta sus decisiones genéricas de Space Tech/HUD cuando contradigan el Recovery Brief.
5. `specs/spec.md`, `specs/plan.md`, `docs/playtest/*`, `docs/video/*`.

## Autoridad de alcance — no negociable

No intentes embellecer cinco juegos. Para Fexpocruz, el producto público es **un solo hero**: `AURA: ANTES DEL HUMO — Ruta de escape`. PULSO pasa a attract mode de 10–15 s. RADIO ROJA, MURO y SALIDA se ocultan del hub público y quedan como prototipos post-evento. El hub ya no dice “cinco juegos” ni exige elección: abre directamente la experiencia hero o muestra una landing muy corta con un CTA único.

No preguntes por preferencias cosméticas. Si falta una decisión, elegí la opción que favorece: lectura instantánea, acción con un pulgar, tensión clara, buen resultado visual, estabilidad offline y calidad demostrable.

## Objetivo de producto

Una persona que pasa por un stand de 1×1 m o escanea un QR debe:

- entender en 1 segundo que hay fuego y algo valioso en riesgo;
- entender en 3 segundos que debe llevar una respuesta desde una base a un foco;
- lograr su primer trazo válido antes de 8 segundos, sin tutorial textual largo;
- jugar una ronda completa en 35–45 segundos;
- ver de manera física que su ruta salvó o perdió hectáreas;
- querer una revancha por mejorar la ruta; y
- ver un ranking/QR/CTA sin formulario obligatorio.

No usar el juego para hacer claims no auditados sobre minutos de anticipación, hectáreas reales o eficacia de Aura. Es una metáfora jugable, no una simulación operacional ni una promesa científica.

## Fase 0 — auditoría reproducible antes de editar

1. `git status --short`; preservá cambios ajenos si los hubiera.
2. Corré `pnpm install --frozen-lockfile`, `pnpm test` y `pnpm build`. Guardá resultados en `docs/playtest/RECOVERY-LOG.md`.
3. Levantá localmente el repo y capturá los estados boot, ready, primera acción, acierto, fallo, clutch, resultado y offline en 390×844, 430×932 y 1920×1080.
4. Revisá consola, errores de red, tiempos de carga, target sizes y foco de teclado.
5. Registrá bugs, no los escondas: ruta, severidad, reproducción, causa, fix y evidencia de verificación.

## Fase 1 — recorte y nueva arquitectura

- `/` debe ser una landing/entrada de una sola decisión. No mantener cinco cards. El CTA: `JUGÁ 40 S`.
- `/jugar` debe apuntar al hero; QR y PWA deben abrirlo sin depender de internet después de la primera carga.
- Preservá rutas viejas con redirect o una pantalla de “modo laboratorio” no indexada; no links rotos.
- Definí una fuente de verdad para duración (40_000 ms), seed del día, score, rank y anti-cheat. No duplicar fórmulas en cliente/servidor.
- Implementá cancelación/timeout de fetches. La pantalla nunca puede quedarse en boot porque una API está lenta.
- El ranking cacheado y el seed local deben permitir una ronda offline. No solicitar identidad para empezar.

## Fase 2 — juego hero

Rediseñá `Antes del Humo` como tres incidentes encadenados sobre el mismo predio de día. Mantener una sola métrica primaria: `ha protegidas`.

### Reglas

- 40 s total: 2 s telegraph, 4 s primera guía, 12 s incidente fácil, 13 s bifurcación, 9 s clutch, resolución de 7 s.
- Cada incidente debe tener un activo inequívoco, foco naranja, viento animado, base verde y 2–3 corredores visualmente distintos.
- El trazo empieza desde un nodo/foco grande y usa snap inteligente. Nunca exigir precisión tipo mouse con un pulgar.
- Antes de soltar, enseñar ETA/fantasmal: verde llega, ámbar muy justo, rojo tarde. Después, mostrar convoy/brigada y la consecuencia física.
- Diseñar rutas: rápida pero expuesta, segura pero lenta y atajo condicionado por viento/agua. Las elecciones tienen que dar resultados diferentes y visibles.
- La pérdida no debe sentirse injusta: el UI ya había mostrado ETA/alerta antes del commit.
- Seed del día fijo para comparación; revancha instantánea; score directo y rank diario. No XP, calor, 5 ligas o misiones por delante de la partida.

### Game feel

- Telegraph: pulso de calor, partículas de viento direccionales, halo de amenaza.
- Input: trail con inercia suave y snap legible; feedback de progreso desde el primer píxel.
- Éxito: micro hit-stop <= 80 ms, polvo, vegetación recupera color, audio tonal ascendente y `+ha` que nace del terreno.
- Fallo: ruta se enfría, humo/borde avanza, audio bajo; jamás sacudir toda la pantalla durante varios frames.
- Clutch: activo y borde del fuego laten, no reducir la velocidad de input.
- Motion responsive, sonido opt-in, reduced-motion y vibración opcional.

## Fase 3 — arte, UI y tipografía

La referencia no es un dashboard de hacking, Iron Man ni un template Space Tech. La dirección es **diorama táctil de territorio cruceño al anochecer**: relieve, senderos, potreros irregulares, monte seco, agua, polvo, tajibos y una detección Aura sobria. Sin fotos documentales de víctimas, sin caricatura infantil, sin assets copiados de franquicias.

- Reemplazá grids rectangulares uniformes, backgrounds casi negros, anillos repetidos, glow generalizado y tipografía monoespaciada para párrafos.
- Usá display robusto/condensado para titulares y una sans clara para instrucciones. Deben estar disponibles offline o empaquetadas por Next.
- Paleta: noche #0D1210, monte #253C29/#3E5A32, tierra #8B5E34/#C99052, brasa #FF5A36/#FF9F1C, Aura #19C37D, crema #F4E7CF. Lila sólo como herramienta, no como tema.
- Desktop: diorama ocupa >= 60% del área útil; HUD no más de una tarjeta primaria + timer. Mobile: diorama 70–74vh y acción lejos del borde/safe areas.
- No texto microscópico, no más de dos líneas de instrucción, no mecanismos explicados por párrafos, no cajas de color planas que sustituyen una escena.
- Todos los targets >=48 CSS px, focus visible, contraste AA, click/keyboard/touch todos funcionales.

## Fase 4 — referencias visuales con ChatGPT Images

Usá el skill `chatgpt-web-image` si está disponible y seguí su loop: una imagen por prompt, referencias reales del repo, QA visual, nunca collage. Antes, leé el brief y los assets actuales. Generá sólo assets de referencia/arte que se puedan usar legalmente y que no lleven texto/logos horneados:

1. `hero-map-diorama.png`: vista superior 9:16, predio de Chiquitanía estilizado al anochecer, base Aura, caminos, monte, agua y foco distante, sin UI.
2. `incident-house.png`: asset de casa/puesto visto desde arriba, estilo diorama coherente, sin texto.
3. `incident-water.png`: tanque/laguna/infraestructura de agua, mismo estilo, sin texto.
4. `incident-corral.png`: corral/ganado sugerido por siluetas seguras y no realistas, mismo estilo, sin texto.

Cada imagen debe pasar: un solo frame, sin collage, sin texto, sin marcas ajenas, paleta coherente, escala legible en móvil. Si no pasa tras tres intentos, detenerte, dejar evidencia y usar una alternativa vectorial propia; no meter una imagen mala.

## Fase 5 — QA real, no simulación disfrazada

Las pruebas unitarias actuales no bastan. Añadí pruebas de:

- duración 40 s;
- primera ruta guiada siempre válida;
- cada una de las rutas alternativas produce un resultado reconociblemente diferente;
- score/seed coinciden cliente-servidor;
- offline/fetch timeout no bloquea ready;
- no hay ruta imposible en 100+ seeds;
- accesibilidad básica y targets en mobile;
- navegación QR → juego → resultado → revancha.

Hacé 30 min de playtest por el hero con sesiones deliberadas: principiante, jugador rápido, errores, una mano, sin audio, pantalla chica, red offline, recargas. No simules “30 min” con un test de seeds. Dejá en `docs/playtest/RECOVERY-LOG.md` hora, escenario, bug, decisión tomada y evidencia. Corregí problemas de comprensión y balance; repetí el test hasta no tener P0/P1 abiertos.

## Fase 6 — trailer y short-form

No grabes nada antes de los gates anteriores.

- Loop final 16:9, 15 segundos, 1080p, sin audio necesario: foco → ruta → salvación + ha → ranking → QR/URL. El primer y último frame deben conectar.
- Dos verticales 9:16 de 12–16 s: uno es un reto/clutch; otro comunica anticipación sin promesas no verificadas.
- Gameplay 100% de la build final. Sin cursor, DevTools, loading, texto de placeholder, glitches, uploads de pantalla o UI vieja.
- Revisá frames cada 2–3 s, contraste de QR y legibilidad sin audio. Si una toma parece prototipo, se descarta.
- Documentá comando de captura y edición reproducible; no uses repos de generación de video como excusa para sustituir gameplay real.

## Fase 7 — entrega

1. `pnpm test` y `pnpm build` deben quedar verdes.
2. Entregá tabla de gates con evidencia real y rutas de screenshots/video.
3. Mostrá diff preciso, no resúmenes vacíos.
4. Commit atómico con mensaje descriptivo y push al remoto configurado. No incluir secretos, tokens ni datos de personas.
5. Si el tiempo no alcanza, termina un hero premium y estable. No reintroduzcas cuatro minijuegos mediocres para simular amplitud.

La barra es: “alguien que no conoce Aura entiende, juega, se sorprende y pide revancha”, no “hay animaciones y tests pasan”. Trabajá de manera sostenida hasta cubrir el scope completo. Si un supuesto cambia la dirección, anotá el tradeoff y elegí la opción que proteja calidad, comprensión y viabilidad para mañana.


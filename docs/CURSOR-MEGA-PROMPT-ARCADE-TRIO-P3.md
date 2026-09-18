# Cursor mega prompt — AURA ARCADE P3: el trío de Fexpocruz

Pegá este documento completo en Cursor desde la raíz `C:\AdrianOliver-dev\Aura\aura-arcade`.

---

Actuá como **director de juego, diseñador UX móvil, programador de interacción y responsable de QA** de AURA ARCADE para Fexpocruz. No estás autorizado a convertir una prueba técnica en “producto terminado” porque `pnpm build` pase. Entregá cambios reales, evidencia reproducible y límites honestos.

## Contexto comprobado

- El producto público es una **Sala Aura de tres juegos**: **ANTES DEL HUMO**, **PULSO** y **RADIO ROJA**.
- **MURO y SALIDA están retirados.** No los revivas, no los dejes en el reel, no los ofrezcas como laboratorio, no dejes imports, APIs, simulaciones, tests ni enlaces nuevos. Marcadores a rutas viejas redirigen a `/lab`.
- HUMO es el hero: 40 s y un trazo base → foco. PULSO y RADIO son rondas de 45 s.
- El trabajo previo dejó `docs/playtest/sessions.jsonl` como archivo de sesiones local/runtime. **No lo borres, resetees, cambies ni incluyas en commits.** Tampoco reclames que un robot headless fue una prueba humana.
- Leé primero `docs/P3-TRIO-SCOPE.md`, `docs/P3-INTERACTION-REPAIR.md`, `docs/video/final/STALE-AFTER-P3.md`, las simulaciones de `lib/`, los componentes de cada juego y el git diff. Conservá cambios ajenos.
- El fondo original de Sala Aura está en `public/art/sala-aura-chiquitania-v1.png`. Es atmósfera, no un sustituto de la información jugable.

## Qué significa calidad aquí

No aceptes grillas de celdas, hexágonos, círculos y blobs genéricos como arte final. Tampoco pantallas negras con tres botones gigantes, HUDs que compiten con el juego, fuentes diminutas, párrafos de tutorial, “cargando” sin progreso, o un resultado lleno de formularios antes de la revancha.

La experiencia debe dar esta sensación: tierra roja, monte, agua y brasa al anochecer; energía de feria; un toque de percusión/rasgueo en 6/8 que remite al oriente sin usar música ajena ni clichés visuales. La prioridad es claridad y respuesta táctil, no fotorealismo.

## Reglas no negociables

1. **FTUE en dos segundos.** Mostrá una acción, un objetivo visible y una respuesta inmediata. Si necesitás más explicación, simplificá la regla; no agregues texto.
2. **Mobile primero.** Probá 390×844 con dedo y 1920×1080 en kiosk. Objetivos táctiles >=48 CSS px; `touch-action` explícito; no dependas de hover, teclado ni puntería de mouse.
3. **El estado manda.** Cliente, servidor y replay comparten las mismas reglas en `lib/*/sim.ts`. No inventes un resultado visual que el servidor luego niega.
4. **Sin autoridad falsa.** No inventes fuentes, licencias, playtests humanos, screenshots, capturas de video o minutos de juego. Nombrá una limitación si no existe evidencia.
5. **No tocar secretos ni datos de usuarios.** No subas `.env`, `.data`, QR con datos reales, ni `docs/playtest/sessions.jsonl`.

## Pasada de investigación y arte

Antes de cambiar dirección de arte, leé estas skills si existen y seguí sus instrucciones:

```text
@C:\Users\diego\.cursor\skills\chatgpt-web-deep-research\SKILL.md
@C:\Users\diego\.cursor\skills\chatgpt-web-image\SKILL.md
```

- Usá Deep Research para una investigación concreta sobre kioscos de feria, onboarding de juegos de una mano, legibilidad a distancia y retención de minijuegos. Guardá citas, fecha, consulta y decisiones derivadas en `docs/polish/research/`; no una lista decorativa de enlaces.
- Usá Images como un bucle dirigido, con referencias reales del repositorio y un prompt por pieza. Generá solo activos que se integrarán: por ejemplo, tres key-art coherentes o texturas de territorio. Rechazá resultados con texto mal escrito, marcas, UI falsa, estética genérica o estilos incompatibles. Conservá prompt, selección y uso en un manifiesto de arte.
- Si una herramienta no está disponible, no fingas que se usó. Diseñá con los activos locales y documentá el bloqueo.

## Trabajo obligatorio, en orden

### 1. Sala Aura y navegación

- La sala debe presentar los tres retos con título, verbo/acción, duración y una jerarquía visual clara. No puede parecer una lista de tarjetas SaaS.
- Desde cualquier momento de HUMO, PULSO o RADIO debe haber una ruta visible a **Sala Aura** sin tapar el input del juego.
- Cada final debe priorizar: resultado legible → **OTRA RONDA** → **VOLVER A LA SALA** → compartir/ranking opcional. Nunca obligues a llenar alias para volver a jugar.
- Actualizá metadata, copy, loop y QR para que digan tres retos; no cinco.

### 2. HUMO — prueba de comprensión real

- Jugá 20 rondas variadas. Verificá específicamente: down dentro de la base, trazo visible, snap que se anuncia, soltar en el aro naranja, ruta que no se corta al rozar un borde, fuego que se apaga solo después de una ruta válida, y explicación de por qué una ruta fue tarde.
- El foco tiene que ser inequívoco. La base, el objetivo y la línea válida deben tener colores, contraste y movimiento diferentes. La línea guía no puede convertirse en garabato o competir con el trazo real.
- Si hallás un fallo de input, arreglá el estado/simulación, agregá un test y reprobá las seeds. No tapes el fallo con copy.

### 3. PULSO — ritmo entendible, no radar decorativo

- La regla es: **esperá que el aro naranja toque una brasa; ahí tocá**. El aro debe cambiar a naranja únicamente cuando hay hit válido, y debe haber señal “AHORA” sin distraer siempre.
- La primera brasa debe llegar con margen suficiente; no castigues el primer toque accidental como si el jugador ya conociera el sistema.
- La dificultad debe escalar en tres momentos legibles dentro de 45 s: aprender, racha, cierre. Medí tasa de hit, misses, brechas y score en seeds fijas.
- El canvas debe sentirse como territorio y radar de emergencia, no como una cuadrícula verde. Animá con moderación y respetá `prefers-reduced-motion`.
- Diseñá una cama sonora propia, suave y opcional, más hits distintos para perfecto/doble/miss/brecha. El mute tiene que silenciar cama y SFX en los tres juegos.

### 4. RADIO ROJA — decisiones inequívocas bajo presión

- La regla es: **PERSONAS → EVACUÁ; AGUA CERCA → AGUA; VIENTO Y MONTE → CORTE**. Enseñala una sola vez al inicio y reforzala con pista visual clara.
- La pantalla no puede estar vacía mientras espera una llamada. Construí una central visual: transmisión, señal, contador y retroalimentación de casa/racha. Los tres botones deben comunicar su significado además de su color.
- El mazo debe ser determinista, justo y no permitir que el mejor juego sea spamear un botón. Distribuí las acciones y conservá suficientes cargas para una partida perfecta.
- Cada acierto y error debe producir cambio visible y audible: confirmación, golpe de tensión, pérdida de casa o racha, sin flashes que mareen.
- Validá que completar todas las señales correctamente mantenga tres casas; que spam de una acción no gane; y que un timeout afecte una casa de forma entendible.

### 5. Audio y accesibilidad compartidos

- No uses música comercial, enlaces de streaming ni “folk” como etiqueta vacía. Si generás audio, registrá origen/licencia. Si lo sintetizás, describí la composición procedural.
- Subí el volumen del feedback crítico sobre la cama, limitá sonidos repetidos y probá que el mute persiste. Sumá alternativas visuales equivalentes a SFX y una configuración reduced-motion.

### 6. QA visual y captura

- Capturá y revisá por lo menos ready, primera acción válida, error/timeout, acierto, end-win y end-miss de los tres juegos a 390×844 y 1920×1080. Guardá solo capturas que correspondan a la build actual y añadí una hoja de review con hallazgo → fix → evidencia.
- Ejecutá `pnpm test` y `$env:NEXT_DIST_DIR='.next-p3build'; pnpm build`. Si tests modifican una bitácora de timestamp, restaurá ese ruido antes de commit; no restaures cambios de usuario.
- Realizá 30 minutos por juego con interacción real. Si usás automatización para repetir seeds, llamala automatización y además hacé una pasada humana manual. Documentá duración, dispositivo/viewport, rondas, errores, cambios y qué sigue abierto.
- Grabá gameplay limpio en kiosk, sin chrome de Cursor ni cursores dibujados. Verificá duración, resolución, codec y **pista de audio real** con `ffprobe` y escuchá al menos un fragmento de cada export.

### 7. Video

- Rehacé, no recortes a ciegas, los tres assets: loop 16:9 de 12–16 s que muestra los tres juegos y termina con QR/CTA; clutch 9:16; revancha/resultado 9:16. El QR nunca tapa instrucciones ni mute.
- Cada clip debe mostrar una acción comprensible, respuesta jugosa y CTA final. No muestres MURO, SALIDA, UI vieja, placeholders ni rutas de laboratorio.
- Guardá comando reproducible, raw, export, framegrabs y manifiesto. Señalá explícitamente si falta una captura humana.

## Gates para cerrar una pasada

No digas “terminado” si falta cualquiera de estos:

- [ ] `rg -n -i "muro|salida" app components lib` no devuelve implementación viva; solo redirects/historial claramente justificados.
- [ ] Tests y build verdes, sin alterar `sessions.jsonl` ni secretos.
- [ ] En cada juego, un visitante entiende qué hacer en la primera pantalla y el input crítico se verificó en móvil.
- [ ] Balance con pruebas deterministas y un log de playtest humano verificable.
- [ ] Capturas actuales revisadas a 390 y 1920, con hallazgos solucionados o declarados.
- [ ] Videos nuevos con audio que corresponde a la build actual, QR legible y `ffprobe` incluido.
- [ ] Commits atómicos, tree limpio excepto cambios preexistentes excluidos, y push a `origin/main` solo después de los gates.

## Formato de entrega

Respondé con: commit(s), archivos cambiados, resultados exactos de test/build, rutas de capturas/videos, qué se jugó realmente, y una lista breve de limitaciones que siguen abiertas. No uses frases como “pulido”, “viral” o “final” sin evidencia concreta.

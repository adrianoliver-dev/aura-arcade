# AURA ARCADE — recuperación de producto para Fexpocruz

**Estado:** dirección de producción. No es una lista de deseos ni un permiso para sumar features.

**Fecha:** 17 de septiembre de 2026. Expocruz abre mañana, 18 de septiembre, y opera de 17:00 a 00:00. El evento mezcla negocio, familias y entretenimiento; el juego debe detener a un visitante general antes de cualificar a un posible cliente de Aura.

## Decisión de alcance

No lanzar cinco juegos equivalentes. Hoy son cinco prototipos de 90 segundos con una capa de HUD común. Eso diluye el tiempo de arte, audio, prueba y comunicación, y obliga a una persona que pasa por el stand a elegir antes de entender por qué debería jugar.

La experiencia pública pasa a ser una sola:

> **AURA: ANTES DEL HUMO — Ruta de escape**
>
> Un predio estilizado está en peligro. Ves un foco, el viento y lo que está en juego. En 40 segundos trazás la ruta de respuesta más inteligente antes de que la ventana se cierre. El resultado comunica hectáreas protegidas, una medalla clara y tu puesto del día.

`PULSO` queda como animación de atracción de 10–15 s en la pantalla del stand, no como uno de cinco destinos. `RADIO ROJA`, `MURO` y `SALIDA` quedan fuera del selector público de mañana: pueden reaprovecharse como prototipos post-evento sólo si pasan sus propios gates de diversión.

La prioridad no es “más contenido”. Es que una sola ronda tenga una fantasía, una elección que importe, tensión visible, un momento de maestría y un resultado compartible.

## Evidencia de la auditoría actual

### Lo que sí funciona

- Hay una base web separada de Aura producción, PWA, rutas, QR, ranking y simulaciones deterministas.
- `pnpm test` está verde: 26 pruebas. Verifica reglas, seeds, parseo y batería de simulación; no demuestra diversión ni legibilidad.
- `pnpm build` del frontend relacionado pasó. La arquitectura de servidor puede verificar runs y degradar sin red.
- El gesto de **Antes del Humo** expresa una decisión relacionada con el producto: percibir un foco, elegir una ruta y proteger un activo.

### Lo que bloquea el lanzamiento como producto premium

1. **Promesa fragmentada.** El hub anuncia “cinco juegos” antes de ofrecer una razón para jugar. El visitante de feria no llegará con tiempo ni paciencia para comparar prototipos.
2. **Tiempo incorrecto.** Todos duran 90 s. En un stand pequeño, más el onboarding, resultado y cambio de jugador, se vuelve una cola de más de dos minutos. El juego público necesita una partida de 35–45 s y menos de 3 s para empezar.
3. **UI plantilla.** `ArcadeReady`, `ArcadeHud` y el uso uniforme de tipografía monoespaciada, glow, grids y anillos hacen que los cinco juegos parezcan variaciones de una demo de dashboard. Un tema no sustituye arte ni claridad.
4. **Relación señal–acción débil.** En RADIO hay texto y tres botones sin una escena que explique el riesgo. En MURO se ve una cuadrícula sin topografía, fuego expresivo ni un objetivo dramático. En PULSO, los largos momentos sin brasas hacen que el jugador no sepa cuándo actuar.
5. **No existe jerarquía espacial.** En desktop se desperdicia gran parte de la pantalla; en móvil, el HUD compite con el tablero. Una sola métrica primaria y una amenaza grande deben ganar el encuadre.
6. **El “juice” no arregla la decisión.** Partículas, vibración y labels de acierto son útiles sólo después de que un jugador entendió por qué una acción fue inteligente. Primero se necesita telegraph, agencia y consecuencia.
7. **Video demasiado largo y poco selectivo.** El loop de 72 s y los cinco juegos en secuencia no dan un hook claro en 1–2 segundos. Si se capturan prototipos, el video certifica los problemas en vez de resolverlos.
8. **Progresión mal planteada para feria.** XP, calor, cinco ligas y misiones diarias añaden lectura antes de establecer diversión. El ranking diario y el reto “ganale a esta marca” son suficientes para la feria. La metaprogresión pertenece a la versión post-evento.

## North star y criterio de éxito

La pantalla debe poder leerse desde el pasillo sin audio:

- 1 s: “hay fuego y algo valioso está en riesgo”.
- 3 s: “arrastro desde la base hasta el foco por el camino mejor”.
- 10 s: “mi ruta cambia el resultado y quiero optimizarla”.
- 45 s: “protegí X ha; puedo superar a alguien; sé qué escanear”.

No se aprueba una build por compilar. Debe aprobar:

| Gate | Condición medible |
| --- | --- |
| Primera acción | 5 personas nuevas inician sin explicación adicional; 4/5 hacen un trazo válido antes de 8 s. |
| Lectura | 5/5 identifican base, foco, activo y el objetivo antes de jugar. |
| Decisión | Ruta corta/rápida, ruta segura/larga y atajo arriesgado producen resultados claramente distintos. |
| Revancha | Al menos 3/5 piden otra partida por mejorar una ruta, no por confusión. |
| Mobile | 375 × 667, 390 × 844 y 430 × 932: tablero íntegro, acción principal no tapada, targets >= 48 CSS px. |
| Stand | 16:9: lectura a 2 m; el tablero ocupa >= 60% del área útil; QR nunca aparece encima de gameplay. |
| Resiliencia | Funciona tras recarga sin Wi‑Fi con seed local, ranking cacheado y QR visible. |
| Rendimiento | 60 fps objetivo; cero error de consola; sin layout shift al iniciar ni al terminar. |

## Diseño del juego hero: Antes del Humo 1.0

### Fantasía

No eres un “cursor dibujando una línea”. Eres quien ve el riesgo antes que el humo y abre la única ruta que salva el predio. El mapa es un diorama táctil de la Chiquitanía/Chaco al anochecer, inspirado en relieve, potreros, monte seco, tajibos, caminos de tierra y cuerpos de agua; no una foto documental de un desastre ni una grilla de placeholder.

### Ronda de 40 segundos

| Tiempo | Beat | Interacción |
| --- | --- | --- |
| 0–2 s | Stinger: aparece foco naranja, viento y activo destacado. | Ninguna; el riesgo se entiende. |
| 2–6 s | Tutorial contextual sobre la primera ruta. | Un trazo guiado y perdonable. |
| 6–18 s | Incidente 1: salvamento fácil. | Trazar ruta; feedback inmediato de ETA y hectáreas. |
| 18–31 s | Incidente 2: bifurcación real. | Elegir velocidad versus seguridad; el viento cambia el valor de la ruta. |
| 31–40 s | Incidente 3: “clutch”. | Tomar la mejor decisión con información parcial, no precisión milimétrica. |
| 40–47 s | Resolución cinematográfica. | El fuego se detiene o alcanza el borde; cuenta hectáreas y muestra medalla. |
| 47–55 s | Resultado y CTA. | Revancha instantánea / QR / marca diaria. |

La ronda no debe congelar input antes de la resolución ni pedir nombre. El alias se propone después de un buen resultado y nunca bloquea “Otra ronda”.

### Reglas y balance

- Tres incidentes, no siete. Cada incidente tiene **un activo reconocible** (casa, agua, corral o puesto), un vector de viento visible y dos a tres corredores distinguibles por terreno.
- Un trazo empieza sólo al tomar el nodo/base grande o tocar el foco. El juego dibuja el camino válido más cercano: no castigar por trazos imperfectos o dedos grandes.
- La ruta se precalcula y se muestra como una línea fantasma: verde = llegás, ámbar = llegás justo, rojo = tarde. La línea deja claro *por qué* la elección es buena.
- La puntuación usa una sola medida dominante: `hectáreas protegidas`. Las métricas secundarias son sólo ETA y medalla, no un segundo score opaco.
- Medallas: `ALERTA` (completó), `RUTA CLARA` (2/3 buenos), `OJO DE FUEGO` (3/3 + sin retraso). Nada de 15 títulos locales que nadie puede leer.
- La dificultad sube mediante caminos y viento, nunca reduciendo el target de toque, ocultando información crítica o acelerando la UI bajo el dedo.
- La mejora entre revancha y revancha es comprensible: mismo predio del día, mismo seed y una marca concreta a superar. Cambiar seed sólo tras 3 reintentos o al día siguiente.
- Todo número con significado real (hectáreas, minutos de anticipación, detección) debe tener fuente/proveniencia interna. No repetir `20 min` como claim de marketing sin baseline verificable.

### Feedback / game feel

- Antes de cada foco: pulso de calor, viento con partículas orientadas, sonido de radio muy corto y un halo que acelera. El jugador debe anticipar, no reaccionar a ciegas.
- Al comprometer ruta: el convoy/brigada viaja por ella, dejando polvo y una línea de luz. Esto confirma agencia durante el tiempo de viaje.
- Buen trazo: micro-hit-stop 60–80 ms, expansión de verde, sonido tonal ascendente y número de hectáreas que se integra al terreno. Mal trazo: la línea se apaga; no usar sacudida de pantalla permanente.
- Clutch: ralentización visual breve, no ralentización de controles; audio se abre; el activo late. El payoff es visible incluso sin sonido.
- Evitar “glow por todo”. El glow es reservado para foco, ruta activa y recompensa. Fondo, HUD y botones deben ser mates.
- Respetar `prefers-reduced-motion`; vibración es opcional y breve; audio tiene estado claro y persistente.

## Dirección visual y de UI

### Paleta y materialidad

| Rol | Token | Uso |
| --- | --- | --- |
| Noche | `#0D1210` | cielo/fondo, nunca negro plano puro |
| Monte | `#253C29` / `#3E5A32` | vegetación por capas, baja saturación |
| Tierra | `#8B5E34` / `#C99052` | caminos y polvo |
| Brasa | `#FF5A36` / `#FF9F1C` | peligro y cuenta regresiva |
| Aura | `#19C37D` | detección, ruta válida y confirmación |
| Crema | `#F4E7CF` | texto principal y activos |
| Lila | `#B8A4FF` | sólo herramienta/cortafuego, no marca global |

- Reemplazar la grilla rectangular uniforme por un **mapa topográfico estilizado**: curvas de nivel sutiles, parcelas irregulares, senderos, vegetación en grupos, espejo de agua y siluetas de activos. Cada elemento debe tener escala, sombra y textura coherentes.
- Reemplazar el “HUD sci‑fi de plantilla” por una interfaz editorial de emergencia: tarjeta de misión pequeña arriba, gran contador situado cerca de la amenaza y chips de estado con icono/forma además de color.
- Usar una familia display contundente y humana para 3–8 palabras por pantalla; usar una sans legible para el resto. No monoespaciada para párrafos. Cargar fuentes de manera local/estable para modo offline.
- El logo Aura aparece al abrir, al resultado y en el QR. Durante gameplay, la marca nunca compite con el foco.
- No emojis, no iconos de stock mezclados, no bloques de color con texto centrado como única representación de agua/corte/evacuación.

### Layout obligatorio

**Mobile vertical:** tablero 70–74vh centrado; HUD de una línea arriba; franja inferior sólo cuando se requiera una acción; zona de pulgar libre; texto de instrucciones máximo dos líneas.

**Laptop 16:9:** tablero/diorama a 60–70% de ancho, con el escenario visible desde el fondo del stand. A un lado, una columna de resultado/leaderboard de alto contraste. No escalar una pantalla móvil con espacios muertos.

**TV attract:** no simular una app. Usar montaje con el foco enorme, una ruta que aparece, una salvación, marcador y QR. El tablero y la tipografía deben leerse en silencio desde 2 m.

## UX y conversión del stand

1. La TV/laptop en loop hace una sola pregunta visual: **“¿LLEGÁS ANTES DEL HUMO?”**.
2. QR físico y digital: `ESCANEÁ · JUGÁ 40 S` + dominio grande. QR de alto contraste, margen blanco y URL humana.
3. La persona juega en su teléfono; la pantalla del stand atrae y enseña ranking. No entregar el único dispositivo de la mesa a una sola persona por 90 segundos.
4. El resultado ofrece sólo tres decisiones: `REVANCHA`, `VER RANKING`, `SEGUIR AURA`. El CTA de WhatsApp B2B aparece como una cuarta opción discreta para quien seleccione “tengo campo / brigada / municipio”.
5. No pedir teléfono, nombre ni consentimiento antes de jugar. Capturar interés con un gesto explícito post-game y explicar para qué se usará.
6. Staff script de ocho segundos: “Escaneá, elegí la ruta que llega antes del fuego. Si protegés el predio, entrás al ranking de hoy.” Para ICP: “¿Operás campo o brigada? Te muestro cómo Aura convierte esta lógica en alertas reales.”

## Video: reemplazo, no retoque

No usar el loop de 72 s como pieza principal. Producir después de que el hero pase sus gates.

### Loop de stand (15 s, 16:9, sin audio obligatorio)

- 0.0–1.2: foco naranja rompe el mapa. Texto: `¿LLEGÁS ANTES DEL HUMO?`.
- 1.2–5.5: la ruta verde cruza el terreno; ETA cambia de rojo a verde.
- 5.5–8.5: activo salvo; `+42 ha` entra como payoff físico.
- 8.5–11.5: medalla + ranking del día.
- 11.5–15.0: endcard: `AURA ARCADE · JUGÁ 40 S` + QR + URL. El último frame enlaza visualmente con el primero para loop.

### Dos shorts (9:16, 12–16 s)

- **Short reto:** fracaso inminente → ruta salvadora → “¿me ganás?” → QR/URL pequeño pero legible.
- **Short historia:** “el foco no avisa” → jugada de clutch → resultado → `AURA anticipa el riesgo` sin afirmar métricas no auditadas.

Capturar gameplay real en navegador a 1080p/60 si se puede; no usar capturas con cursor, overlays de devtools, loading, placeholders ni pantallas de prototipo. Elegir tomas después de revisar el resultado del playtest. Editar con cortes de intención, no transiciones genéricas.

## QA obligatorio

### Instrumentación mínima

Registrar localmente (sin PII): `start`, `first_action_ms`, `first_valid_action_ms`, `incident_result`, `retry`, `share`, `qr_open`, `interest_opt_in`, `offline`. Añadir versión de balance y seed. No registrar coordenadas crudas de toque si no son necesarias.

### Matriz manual

- 5 jugadores nuevos de pie; teléfono propio; sin explicación salvo la primera frase del staff.
- 10 rondas consecutivas con una mano y en un dispositivo Android medio.
- Chrome Android, Safari iOS, laptop táctil/no táctil y monitor 16:9.
- Red normal, offline después de precargar, recarga a mitad de partida y retorno desde QR.
- Lectura de QR a 1 m, 1.5 m y en luz de feria.
- Audio on/off, reduced motion, orientación vertical y landscape.

### Definition of done

No marcar “terminado” hasta adjuntar:

1. capturas mobile/desktop sin DevTools;
2. video de tres rondas reales y un loop final;
3. salida de pruebas unitarias, build y una prueba browser por ruta;
4. tabla de cinco jugadores y los cambios que provocaron;
5. lista de fallos abiertos, si existen;
6. commit pequeño y mensaje que describa el resultado, no “final”.

## Post-Fexpocruz (sólo después del hero)

Cuando el hero demuestre retención, se puede abrir una temporada de tres modos con identidad diferenciada:

- **Ruta de fuego:** planificación de ruta (hero actual).
- **Radio roja:** gestión de prioridades; debe mostrar un diorama/incident board y consecuencias, no tres botones en vacío.
- **Línea segura:** defensa de perímetro; debe ser un puzzle de pocos nodos con feedback de propagación, no una cuadrícula para rellenar.

Se prioriza sólo el modo que, en playtest, consiga mayor primera comprensión, tasa de revancha y calidad de share. Nunca se desarrollan tres en paralelo sin esa evidencia.

## Fuentes de diseño usadas para esta dirección

- Fexpocruz confirma 18–27 de septiembre de 2026, 17:00–00:00, con público de negocios, familias y entretenimiento: https://www.fexpocruz.com.bo/expocruz-2026
- NN/g: la adquisición de un target depende de tamaño y distancia (Fitts); fundamenta targets amplios y gestos perdonables: https://www.nngroup.com/videos/fittss-law-links-buttons/
- NN/g para pantallas grandes: gestos naturales, feedback simple, legibilidad y targets obvios: https://www.nngroup.com/articles/very-large-touchscreen-ux-design/
- GDC sobre feedback satisfaciente como parte del carácter y alma del juego: https://media.gdcvault.com/gdc2016/Presentations/Rouse_Richard_RulesOfTheGame.pdf
- CEIR: el valor comercial de feria depende del follow-up planeado y rápido; el juego no debe convertirse en un formulario previo: https://blog.ceir.org/2013/06/07/effective-and-persistent-follow-up-leads-to-new-business/


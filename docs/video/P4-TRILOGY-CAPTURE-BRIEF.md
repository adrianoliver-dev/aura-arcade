# P4 — captura y entrega de video AURA ARCADE

## Regla de procedencia

Se captura de la misma URL HTTPS y del mismo SHA que se pondrá en el stand. No se reutiliza ningún MP4 de `public/trailers/`, `public/trailers/mpt/` ni `public/trailers/final/`: todos son anteriores a la experiencia P3 actual.

La fuente es gameplay real, sin Chrome, barra de direcciones, cursor, DevTools, overlay de Next, loading ni rutas eliminadas. No sustituir gameplay por video IA. Si un clip no tiene audio real o un QR funcional, se descarta.

## Entregables obligatorios

| Archivo | Duración | Resolución | Historia |
| --- | ---: | --- | --- |
| `public/trailers/p4/aura-arcade-fexpo-loop-16x9.mp4` | 18 s | 1920×1080 | El trío y un QR legible para monitor. Loop sin salto. |
| `public/trailers/p4/aura-arcade-clutch-9x16.mp4` | 12 s | 1080×1920 | HUMO: base → aro → salvado claro → revancha. |
| `public/trailers/p4/aura-arcade-trio-9x16.mp4` | 15 s | 1080×1920 | Un gesto claro de HUMO, PULSO y RADIO; CTA final. |

H.264 + AAC, `yuv420p`, audio estéreo 48 kHz, sin dependencias remotas para reproducir en el monitor. Si el monitor pide otro códec, entregar una copia adicional, no reemplazar el máster.

## Guion del loop de monitor: 18 segundos

| Tiempo | Imagen y acción real | Texto máximo |
| --- | --- | --- |
| 0.0–2.0 | Foco de HUMO, base verde y aro naranja aparecen. | `¿LLEGÁS ANTES DEL HUMO?` |
| 2.0–6.0 | Un trazo único y limpio: sale de BASE, llega a `SOLTÁ AQUÍ`, el fuego se apaga. | `TRAZÁ LA RESPUESTA` |
| 6.0–8.0 | Payoff de hectáreas y ruta salvada. | `+ ha PROTEGIDAS` |
| 8.0–11.0 | PULSO: aro/brasa coinciden, toque correcto y feedback de racha. | `TOCÁ JUSTO` |
| 11.0–14.0 | RADIO: señal entendible, decisión correcta y casa protegida. | `DECIDÍ RÁPIDO` |
| 14.0–18.0 | Endcard calma, QR con quiet zone y dominio humano. | `AURA ARCADE · ESCANEÁ Y JUGÁ` |

El primer frame y el último comparten la misma paleta de tierra/brasa y una transición discreta de humo, no un corte negro. El QR solo vive en la endcard, ocupa al menos 240 px de alto a 1080p y conserva margen claro; jamás cubre el mute, un gesto o una instrucción.

## Guion de shorts

### Clutch, 9:16, 12 segundos

1. 0–2 s: `EL FOCO CRECE` y foco cerca de la casa.
2. 2–7 s: dedo/trazo real base → aro, respuesta `LLEGÓ` y apagado inequívoco.
3. 7–10 s: hectáreas/medalla, sin ranking llenando pantalla.
4. 10–12 s: `¿ME GANÁS?` + URL humana; QR pequeño opcional solo si no tapa nada.

### Trío, 9:16, 15 segundos

1. 0–5 s: HUMO — un trazo limpio y salvado.
2. 5–9 s: PULSO — `¡AHORA!` seguido por un acierto, no por un miss.
3. 9–12 s: RADIO — pista y elección correcta con reacción visible.
4. 12–15 s: `AURA ARCADE · FEXPOCRUZ` + dominio/QR.

## Sonido y mezcla

- Usar solo cama y SFX originales/licenciados. No canciones comerciales, “folklore” descargado ni audio de TikTok.
- Dirección: 6/8 suave, percusión seca, rasgueo/plucks discretos y ambiente de monte nocturno. La firma puede remitir a Santa Cruz sin imitar una grabación o artista reconocible.
- Los eventos críticos —inicio válido, acierto, salvado, error y final— superan la cama sin distorsión. El loop debe funcionar también en silencio: texto y reacción visual explican cada beat.
- Verificar que `mute` silencia cama y SFX de los tres retos. La exportación no puede ser AAC silencioso etiquetado como “audio”.

## Proceso de captura y QA

1. Hacer el smoke test de despliegue y jugar manualmente las tomas. Para el gesto HUMO, usar una ruta válida; no dibujar garabatos de prueba.
2. Capturar sin UI del navegador en kiosk/viewport correcto. Guardar raw por separado.
3. Editar con cortes de intención; no usar transiciones genéricas ni overlays de texto que compitan con la acción.
4. Extraer frames a 0, 2, 6, 10, 14 y último segundo. Revisar legibilidad, QR, ausencia de chrome y coherencia del arte.
5. Ejecutar `ffprobe` y escuchar al menos 10 s de cada export por altavoz y por auriculares.
6. Guardar para cada clip un Markdown con SHA, URL, comando de captura, comando de export, origen de audio, `ffprobe` y framegrabs en `docs/video/p4/<nombre>/`.

Solo después de eso se reemplazan las rutas que el monitor usará. Un MP4 nuevo no es aceptado por nombre, duración o build verde: debe mostrar el producto vigente.

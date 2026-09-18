# P3 — reparación de interacción HUMO

Fecha: 2026-09-18. Alcance: `AURA: ANTES DEL HUMO`, no los cuatro prototipos de Sala Aura.

## Problemas reproducidos

1. El primer foco mostraba el predio durante cuatro segundos, pero bloqueaba el arrastre.
2. Un trazo de más de 96 muestras dejaba de actualizar su punto final; al soltar podía cancelar o llegar a un lugar viejo.
3. El tiempo de llegada dependía de cada vuelta del garabato. Eso hacía que el estado temprano/tarde pareciera arbitrario.
4. `dayGhost` unía todos los trazos de una partida en una polilínea punteada, creando las curvas blancas de la captura reportada.
5. Un canvas que empezaba transitoriamente en 0×0 calculaba celdas negativas, lanzaba `IndexSizeError` y detenía su RAF.

## Reparación aplicada

- La primera ventana abre en `0 ms`; el aro naranja y la guía aparecen antes y después de iniciar.
- El gesto conserva sólo `BASE → posición actual → FOCO`; no se acumulan puntos ni hay límite de 96.
- Al liberar se lee la coordenada del `pointerup`, no una muestra antigua.
- La llegada usa el corredor canónico base→foco. La habilidad es reaccionar y soltar en el objetivo, no dibujar un laberinto.
- El fuego de un foco resuelto desaparece y la ruta segura queda como feedback verde.
- Se eliminó el ghost de día del mapa y se blindó el layout/RAF cuando el canvas no tiene tamaño.

## Evidencia de esta pasada

- `pnpm test`: 40/40. Incluye el caso “garabato no cambia el rescate” y canvas 0×0.
- `pnpm build` con `NEXT_DIST_DIR=.next-p2build`: verde.
- [ready-390.png](../polish/design-review/ready-390.png): BASE, aro naranja, instrucción y CTA legibles.
- [save-390.png](../polish/design-review/save-390.png): 45 ha, casa sin fuego y corredor verde.

## Límites que siguen abiertos

- Esto no sustituye una sesión humana cronometrada en teléfono físico.
- Nota histórica: aquel alcance aún nombraba PULSO, RADIO ROJA, MURO y SALIDA. En el producto vigente MURO y SALIDA fueron retirados; PULSO y RADIO tienen checks de interacción propios más abajo, pero aún requieren el playtest humano final.
- Los MP4 de `public/trailers/final/` son anteriores a esta reparación; no deben presentarse como gameplay actual.

## P3.1 — respuesta al playtest posterior

El reporte de mesa indicó tres síntomas distintos: se intentaba **rodear** el fuego, la palabra “tarde” llegaba sin un reloj del foco, y un segundo intento correcto podía conservar el aviso de error anterior. No eran problemas de habilidad del visitante: la interfaz dejaba espacio para interpretarlos así.

### Corrección aplicada

- La guía dejó de dibujar el camino A* que parecía que había que calcar. Ahora sólo marca **1 · BASE → 2 · SOLTÁ AQUÍ** y el copy dice de forma explícita que no hay que rodear el fuego.
- HUMO tiene un reloj de respuesta por foco (`FOCO 1/3 · CASA`), separado del reloj global de 40 s. Cuando vence, se retira el aro y el incendio se apaga visualmente a brasa; no se invita a dibujar una solución que ya no puntúa.
- El primer foco tiene 12.04 s de respuesta; estanque y corral tienen 9.84 s y 10.08 s. El imán de inicio/final también se amplió para pulgar móvil.
- Un arrastre válido borra de inmediato el consejo de fallo anterior. Al salvar, el HUD se concentra en `LLEGÓ` y `PRÓXIMO FOCO`, sin seguir anunciando un foco ya resuelto.

### Evidencia reproducible

- `node scripts/p3-humo-gesture-check.mjs`: intenta primero fuera de la base, comprueba el mensaje visible, luego arrastra base→aro y exige hectáreas positivas. Captura: `../polish/design-review/p3-trio/humo-gesture-pass-390.png`.
- `node scripts/p3-pulso-tap-check.mjs`: espera la señal visual `¡AHORA!`, toca el canvas y exige puntaje positivo. Captura: `../polish/design-review/p3-trio/pulso-tap-pass-390.png`.
- `node scripts/p3-radio-decision-check.mjs`: lee la pista de la tarjeta, pulsa la orden correspondiente y exige `¡SÍ!`. Captura: `../polish/design-review/p3-trio/radio-decision-pass-390.png`.

Estos checks usan Chrome headless contra una build de producción a 390×844. Son evidencia de interacción y regresión, no una sustitución de 30 minutos con una persona y su teléfono.

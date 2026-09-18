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
- Los modos PULSO, RADIO ROJA, MURO y SALIDA siguen marcados como `TALLER`; necesitan QA y rediseño independientes antes de una promoción de stand.
- Los MP4 de `public/trailers/final/` son anteriores a esta reparación; no deben presentarse como gameplay actual.

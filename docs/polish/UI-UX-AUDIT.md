# UI/UX audit P2 — decisiones aplicadas

Fuente: `ui-ux-pro-max-skill` (dominios `ux` y `typography`), 17 sep 2026. No es un dump: cada hallazgo tiene una decisión en código.

| Hallazgo (skill) | Decisión aplicada |
| --- | --- |
| Touch ≥48 CSS px (web/Android); 8px entre targets | Base y focos con imán ≥2 celdas; mute 48px; CTA `min-h-14`; gap 8px en end. |
| Contraste 4.5:1, no icono mudo sin nombre | Crema `#F4E7CF` sobre noche; mute con `aria-label` y trazo visible, no solo color. |
| Reduced motion | Partículas/shake/parallax se apagan; el snap y el color del ETA siguen. |
| Excessive motion: 1–2 héroes | Glow reservado a base, ruta y brasa. Cielo mate. |
| Display condensado para acción (Barlow Condensed pairing sports) | Se mantiene Barlow Condensed + Source Sans 3. Se rechaza Orbitron/mono (HUD sci-fi). |
| No hover-only | Pointer + teclado Enter + touch. |
| Jerarquía: el mapa es el producto | Canvas a pantalla completa; tarjeta de tiempo pequeña; instrucción sobre el predio. |
| Forms: ranking no primero | End: resultado → OTRA RUTA → disclosure de ranking/alias. |
| Offline honesto | Si no hay red, copy “sin conexión; tu mejor ronda sigue acá”. Cero tabla inventada. |

Anti-patrones explícitamente evitados: botones w-6, texto <12px en crítico, cyberpunk neon, emoji como icono de mute, ranking tapando el desenlace.

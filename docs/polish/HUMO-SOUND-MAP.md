# Mapa sonoro HUMO

No se reutilizan archivos `/pulso/audio`. Todo es synth Web Audio original.

| Cúe | Función | Notas |
| --- | --- | --- |
| `grab` | Down en base | 196 + 392 Hz, 70–90 ms |
| `tick` | Arrastre | Por distancia ≥0.045, no por frame; gap 90 ms |
| `save` | Snap válido | Ruido + 392/523/784 |
| `miss` / `late` | Fallo o ventana cerrada | Descenso 330→110 |
| `clutch` | Último foco | Compresor ratio 8 durante 900 ms |
| `fire` | Aparece un foco | Gap 1600 ms |
| `bed` | Drone 62/93 Hz | Gain 0.028, siempre más bajo que SFX |

Licencia: original Aura Arcade 2026, usable en el stand. Mute comparte `pulso:muted` para no pelear con el kiosco. `prefers-reduced-motion` apaga vibrate y partículas, no el pitch del ETA.

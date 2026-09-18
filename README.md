# Aura Arcade

Stand Fexpocruz. **Repo aparte de Aura** para no romper producción.

Producto público: **AURA ARCADE**, una Sala Aura de tres retos: **ANTES DEL HUMO** (40 s), **PULSO** (45 s) y **RADIO ROJA** (45 s). MURO y SALIDA fueron retirados; sus rutas antiguas redirigen a `/lab`.

Cuenta: [adrianoliver-dev](https://github.com/adrianoliver-dev).

| Superficie | Ruta | Rol |
|---|---|---|
| Landing | `/` | CTA a Antes del Humo y entrada a Sala Aura |
| Hero | `/jugar` | Antes del Humo |
| Sala | `/lab` | Los tres retos públicos |
| QR | `/qr` | Afiche de stand, generado desde la URL pública |
| TV | `/loop` | Attract en vivo de Antes del Humo |
| Reel | `/reel` | Previsualización en vivo; no sustituye el MP4 final |

Es una metáfora jugable. No afirma minutos de anticipación, hectáreas reales ni eficacia operacional de Aura.

## Local

```bash
git clone https://github.com/adrianoliver-dev/aura-arcade.git
cd aura-arcade
pnpm install
pnpm dev
```

Abrí [http://127.0.0.1:3020](http://127.0.0.1:3020). Tests: `pnpm test`. Build: `pnpm build`.

Ranking en dev: `.data/arcade.json`. En el stand de feria el ranking vive en volumen persistente del contenedor (`PULSO_RUN_SECRET` + `NEXT_PUBLIC_ARCADE_URL=https://expo.aura.ia.bo`). Upstash (`PULSO_KV_URL` / `PULSO_KV_TOKEN`) es opcional si hay más de una instancia.

URL pública: [https://expo.aura.ia.bo](https://expo.aura.ia.bo).

Fuente de verdad de duración, seed del día, score y anti-cheat: `lib/humo/sim.ts`.

## Trailers

Los MP4 existentes son históricos y no se publican como finales. La captura vigente se rige por `docs/video/P4-TRILOGY-CAPTURE-BRIEF.md`; debe ser gameplay real de la build desplegada.

## Licencia

Código MIT. IP original Aura. Ver `LICENSE_GATE.md`.

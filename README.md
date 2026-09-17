# Aura Arcade

Stand Fexpocruz. **Repo aparte de Aura** para no romper producción.

Producto público: **AURA: ANTES DEL HUMO — Ruta de escape**. Una ronda de 40 segundos. Un pulgar. Ranking de hoy.

PULSO queda como attract de 10–15 s en `/loop`. RADIO / MURO / SALIDA viven en `/lab` (no indexados).

Cuenta: [adrianoliver-dev](https://github.com/adrianoliver-dev).

| Superficie | Ruta | Rol |
|---|---|---|
| Landing | `/` | CTA único `JUGÁ 40 S` |
| Hero | `/jugar` | Antes del Humo |
| QR | `/qr` | Afiche de stand |
| TV | `/loop` | Attract PULSO → hero |
| Lab | `/lab` | Prototipos post-evento |

Es una metáfora jugable. No afirma minutos de anticipación, hectáreas reales ni eficacia operacional de Aura.

## Local

```bash
git clone https://github.com/adrianoliver-dev/aura-arcade.git
cd aura-arcade
pnpm install
pnpm dev
```

Abrí [http://127.0.0.1:3020](http://127.0.0.1:3020). Tests: `pnpm test`. Build: `pnpm build`.

Ranking en dev: `.data/arcade.json`. Prod: `PULSO_KV_URL` + `PULSO_KV_TOKEN` y `PULSO_RUN_SECRET`.

Fuente de verdad de duración, seed del día, score y anti-cheat: `lib/humo/sim.ts`.

## Trailers

Gameplay real de la build final. No hay video IA como sustituto. Ver `docs/video/` y `docs/ARCADE-RECOVERY-BRIEF.md`.

## Licencia

Código MIT. IP original Aura. Ver `LICENSE_GATE.md`.

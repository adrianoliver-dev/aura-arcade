# Aura Arcade

Juegos de stand para Fexpocruz. **Repo aparte de Aura** (`Aura-MVP-V2-Front`) para no romper producción.

Cuenta: [adrianoliver-dev](https://github.com/adrianoliver-dev).

## Juegos (90s, un pulgar, ranking hoy)

| # | Juego | Ruta | Fantasía |
|---|---|---|---|
| 1 | PULSO | `/anillos` | Anillos. Tocá al ritmo. |
| 2 | ANTES DEL HUMO | `/humo` | Trazá la ruta. Salvás hectáreas. |
| 3 | RADIO ROJA | `/radio` | Jefe de brigada. Agua / corte / evacuá. |
| 4 | MURO | `/muro` | Pintá el cortafuego. La casa no puede caer. |
| 5 | SALIDA | `/salida` | Tres sendas. Evitá el fuego. Sacá a la gente. |

Sala: `/` · Loop TV Fexpo: `/loop`

## Local (Diego / Micael)

Repo público. Los juegos están jugables y **abiertos a mejorar** (feel, balance, juice). No toquen el front de Aura.

```bash
git clone https://github.com/adrianoliver-dev/aura-arcade.git
cd aura-arcade
pnpm install
pnpm dev
```

Abrí [http://127.0.0.1:3020](http://127.0.0.1:3020). Loop TV: `/loop`. Tests: `pnpm test`.

Ranking en dev: archivo `.data/arcade.json`. En prod: `PULSO_KV_URL` + `PULSO_KV_TOKEN` (Upstash) y `PULSO_RUN_SECRET`.

## Trailers

No hay video IA. El loop del stand es `/loop` (gameplay en vivo). Pack CapCut en `capcut/` para cortar tomas reales (35–45s, mute-proof).

## Licencia

Código MIT. IP original Aura. Ver `LICENSE_GATE.md`.

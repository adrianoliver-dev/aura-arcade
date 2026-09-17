# Aura Arcade

Juegos de stand para Fexpocruz. **Repo aparte de Aura** (`Aura-MVP-V2-Front`) para no romper producción.

Cuenta: [adrianoliver-dev](https://github.com/adrianoliver-dev).

## Juegos

| # | Juego | Ruta | Estado |
|---|---|---|---|
| 1 | PULSO (anillos) | `/anillos` | vivo |
| 2 | ANTES DEL HUMO | `/humo` | vivo |
| 3–5 | — | — | slots vacíos |

## Local

```bash
pnpm install
pnpm dev
```

Abrí [http://127.0.0.1:3020](http://127.0.0.1:3020). El front de Aura sigue en 3000/3010.

Ranking en dev: archivo `.data/arcade.json`. En prod podés poner `PULSO_KV_URL` + `PULSO_KV_TOKEN` (Upstash).

## Licencia

Código MIT. IP original Aura. No copiar juegos de terceros.

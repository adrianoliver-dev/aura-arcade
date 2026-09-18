# AURA ARCADE — salida oficial de Fexpocruz

Este documento evita confundir un deploy técnico con una salida lista para feria. La fuente es `main`; el mensaje de entrega debe fijar un SHA, no decir solo “último main”.

## Condición de salida

El despliegue puede hacerse como **candidato oficial** ahora. No debe anunciarse como cerrado al público hasta que se cumplan los cuatro checks de la sección final:

1. la URL canónica y el QR se probaron desde un teléfono fuera del equipo;
2. el KV guarda un score, sobrevive una nueva instancia y muestra ese score en `/api/humo/leaderboard`;
3. cinco personas nuevas completaron la primera acción en el teléfono objetivo y existe una bitácora de al menos 30 minutos de juego humano por cada reto;
4. los MP4 P4 se capturaron de este build y pasaron su revisión audiovisual.

Los archivos de `public/trailers/final/` son anteriores a P3 y no se deben poner en el monitor.

## Infraestructura que necesita Diego

- **Node 20 o superior** y `pnpm 10.15.0`.
- Un deploy Node de Next; no exportación estática.
- Un Redis REST persistente compatible con Upstash. El filesystem `.data/arcade.json` es solo para desarrollo: en serverless puede ser temporal o de solo lectura.
- HTTPS y un dominio canónico corto. Elegirlo antes de imprimir nada.

### Variables de entorno de producción

Configurar tanto en build como en runtime, sin comitearlas:

```text
NEXT_PUBLIC_ARCADE_URL=https://DOMINIO-FINAL.example
PULSO_KV_URL=https://...upstash.io
PULSO_KV_TOKEN=...
PULSO_RUN_SECRET=<secreto largo, aleatorio y privado>
```

`NEXT_PUBLIC_ARCADE_URL` no lleva slash final. Se compila en los enlaces de compartir y genera los QR visibles; cambiarlo exige un **nuevo build y deploy**, no solo cambiar una variable en caliente. Sin `PULSO_RUN_SECRET` la API se negará a emitir tokens en producción, a propósito. Los tokens y las credenciales de KV nunca se exponen al cliente.

## Secuencia de deploy

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git rev-parse HEAD
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm start
```

Registrar el SHA obtenido con `git rev-parse HEAD` en el panel de deploy y en el acta de feria. El comando `pnpm start` usa el puerto 3020 localmente; el proveedor puede asignar su propio `PORT` o proxy.

## Smoke test después del deploy

Desde una red externa y luego desde un teléfono:

1. abrir `/`, `/lab`, `/jugar`, `/lab/anillos`, `/lab/radio`, `/qr` y `/loop`;
2. confirmar que `/muro`, `/salida`, `/lab/muro` y `/lab/salida` redirigen a `/lab`;
3. escanear QR en `/`, `/qr` y `/loop`: los tres deben abrir `https://DOMINIO-FINAL.example/jugar`, nunca localhost, GitHub ni el dominio de preview;
4. jugar una ronda de cada reto, recargar y comprobar que el ranking conserva el resultado;
5. abrir otra instancia o reiniciar el proceso y confirmar el mismo ranking; esto prueba que realmente usa KV;
6. probar sonido, mute persistente, reduced motion, orientación vertical y retorno a Sala Aura;
7. poner el monitor a 1920×1080, fullscreen/kiosk, y leer el CTA/QR desde 1 y 1.5 metros.

Si falla el punto 3 o 5, detener la impresión y no llamar al ranking “de hoy”. Si falla una ruta o la primera acción no se entiende, queda como candidato y vuelve a corrección.

## Artefactos que acompañan el deploy

- [Brief de video P4](video/P4-TRILOGY-CAPTURE-BRIEF.md): define exactamente qué se captura y cómo se valida.
- [Kit de stand](stand/P4-FEXPO-LAUNCH-KIT.md): monitor, QR impreso, guion de staff y estructura de diapositivas.
- [Scope del producto](P3-TRIO-SCOPE.md): solo HUMO, PULSO y RADIO ROJA.

No se suben `.env`, `.data`, secretos, logs privados ni `docs/playtest/sessions.jsonl`.

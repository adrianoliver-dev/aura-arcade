import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import {
  FRAME_DIR,
  ORIGIN,
  RAW_DIR,
  ensureDirs,
  framesToMp4,
  hideChrome,
  launchPage,
  saveJson,
  showPlate,
  sleep,
  stamp,
  startScreencast,
} from './p4-lib.mjs'

const scenes = (process.env.P4_SCENES || 'humo,pulso,radio,qr').split(',').map((s) => s.trim())
const sizes = (process.env.P4_SIZES || '1920x1080,1080x1920').split(',').map((s) => {
  const [w, h] = s.split('x').map(Number)
  return { w, h, id: `${w}x${h}` }
})

async function clickText(page, needle) {
  const handle = await page.evaluateHandle((text) => {
    return [...document.querySelectorAll('button')].find((node) => (node.textContent || '').includes(text)) ?? null
  }, needle)
  const element = handle.asElement()
  if (!element) {
    await handle.dispose()
    throw new Error(`no encontré botón ${needle}`)
  }
  await element.click({ delay: 25 })
  await handle.dispose()
}

async function dumpFail(page, name, size, err) {
  const dir = path.join('.tmp-p4', 'fail')
  await mkdir(dir, { recursive: true })
  const shot = path.join(dir, `${name}-${size}.png`)
  await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
  const text = await page.evaluate(() => document.body.innerText.slice(0, 2400)).catch(() => '')
  const guide = await page.evaluate(() => ({
    humo: window.__humoGuide?.() ?? null,
    pulso: window.__pulsoGuide?.() ?? null,
    radio: window.__radioGuide?.() ?? null,
  })).catch(() => null)
  console.error(JSON.stringify({ ok: false, name, size, shot, text, guide, err: String(err) }))
}

async function dragHumo(page) {
  await page.waitForFunction(() => window.__humoGuide?.()?.phase === 'play', { timeout: 12_000 })
  const guide = await page.evaluate(() => window.__humoGuide())
  if (!guide?.from || !guide?.to) throw new Error('sin guía HUMO')
  await page.mouse.move(guide.from.x, guide.from.y)
  await page.mouse.down()
  const steps = 22
  for (let i = 1; i <= steps; i++) {
    const u = i / steps
    await page.mouse.move(guide.from.x + (guide.to.x - guide.from.x) * u, guide.from.y + (guide.to.y - guide.from.y) * u)
    await sleep(16)
  }
  await page.mouse.up()
  return guide
}

const PLAY = {
  humo: {
    async prepare(page) {
      await page.goto(`${ORIGIN}/jugar`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      await page.waitForFunction(
        () => [...document.querySelectorAll('button')].some((node) => (node.textContent || '').includes('JUGÁ 40 S')),
        { timeout: 25_000 },
      )
      await clickText(page, 'JUGÁ 40 S')
      await page.waitForFunction(() => window.__humoGuide?.()?.phase === 'play', { timeout: 15_000 })
    },
    async act(page, events, t0) {
      events.push({ t: stamp(t0), cue: 'humo-start' })
      await showPlate(page, '¿LLEGÁS ANTES DEL HUMO?')
      await sleep(2_200)
      await showPlate(page, 'TRAZÁ LA RESPUESTA')
      events.push({ t: stamp(t0), cue: 'humo-grab' })
      const guide = await dragHumo(page)
      events.push({ t: stamp(t0), cue: 'humo-save', extra: { from: guide.from, to: guide.to } })
      await page.waitForFunction(
        () => document.body.innerText.includes('LLEGÓ') || /\b[1-9]\d* ha\b/.test(document.body.innerText),
        { timeout: 8_000 },
      )
      await showPlate(page, 'PROTEGÉ EL PREDIO')
      await sleep(6_500)
    },
  },
  pulso: {
    async prepare(page) {
      await page.goto(`${ORIGIN}/lab/anillos`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      await page.waitForSelector('button[aria-label*="FRENÁ LA BRASA"]', { timeout: 20_000 })
    },
    async act(page, events, t0) {
      await page.click('button[aria-label*="FRENÁ LA BRASA"]')
      events.push({ t: stamp(t0), cue: 'pulso-start' })
      await showPlate(page, 'TOCÁ JUSTO')
      let hit = false
      for (let attempt = 0; attempt < 6; attempt++) {
        await page.waitForFunction(
          () => document.body.innerText.includes('¡AHORA!') || window.__pulsoGuide?.()?.now === true,
          { timeout: 10_000 },
        )
        const guide = await page.evaluate(() => window.__pulsoGuide?.())
        events.push({ t: stamp(t0), cue: 'pulso-now', extra: guide })
        if (guide?.tap) await page.mouse.click(guide.tap.x, guide.tap.y)
        else await page.click('canvas')
        await sleep(180)
        hit = await page.evaluate(
          () =>
            (window.__pulsoGuide?.()?.score || 0) > 0 ||
            [...document.querySelectorAll('p')].some((p) => /^\d+$/.test(p.textContent?.trim() || '') && Number(p.textContent) > 0),
        )
        if (hit) break
        await page.waitForFunction(() => !document.body.innerText.includes('¡AHORA!'), { timeout: 3_000 }).catch(() => {})
      }
      if (!hit) throw new Error('PULSO no anotó')
      events.push({ t: stamp(t0), cue: 'pulso-hit' })
      await sleep(2_400)
    },
  },
  radio: {
    async prepare(page) {
      await page.goto(`${ORIGIN}/lab/radio`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      await page.waitForSelector('button[aria-label*="El predio llama"]', { timeout: 20_000 })
    },
    async act(page, events, t0) {
      await page.click('button[aria-label*="El predio llama"]')
      events.push({ t: stamp(t0), cue: 'radio-start' })
      await showPlate(page, 'DECIDÍ RÁPIDO')
      await page.waitForFunction(
        () => Boolean(window.__radioGuide?.()?.label && window.__radioGuide?.()?.clue && document.body.innerText.includes('PISTA:')),
        { timeout: 16_000 },
      )
      const guide = await page.evaluate(() => window.__radioGuide?.())
      events.push({ t: stamp(t0), cue: 'radio-clue', extra: guide })
      const target = await page.evaluate((label) => {
        const button = [...document.querySelectorAll('button')].find((node) => (node.textContent || '').includes(label))
        if (!button) return null
        const box = button.getBoundingClientRect()
        return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
      }, guide?.label || 'AGUA')
      if (!target) throw new Error('no encontré orden RADIO')
      await page.mouse.click(target.x, target.y)
      await page.waitForFunction(
        () => document.body.innerText.includes('¡SÍ!') || /x[2-9]/.test(document.body.innerText),
        { timeout: 5_000 },
      )
      events.push({ t: stamp(t0), cue: 'radio-ok' })
      await sleep(2_400)
    },
  },
  qr: {
    async prepare(page) {
      await page.goto(`${ORIGIN}/qr`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
      await page.waitForSelector('img[alt*="QR"]', { timeout: 12_000 })
    },
    async act(page, events, t0) {
      events.push({ t: stamp(t0), cue: 'qr' })
      await showPlate(page, 'AURA ARCADE · ESCANEÁ Y JUGÁ')
      await sleep(5_200)
    },
  },
}

async function recordScene(size, name) {
  const scene = PLAY[name]
  if (!scene) throw new Error(name)
  const { browser, page } = await launchPage(size.w, size.h)
  const events = []
  try {
    await scene.prepare(page)
    await hideChrome(page)
    await sleep(180)
    const rec = await startScreencast(page, { width: size.w, height: size.h })
    await scene.act(page, events, rec.t0)
    await sleep(240)
    await rec.stop()
    const file = path.join(RAW_DIR, `${name}-${size.id}.mp4`)
    const meta = await framesToMp4(rec.frames, file, 60)
    await saveJson(path.join(RAW_DIR, `${name}-${size.id}.json`), {
      origin: ORIGIN,
      size,
      name,
      events,
      ...meta,
      file,
    })
    console.log(JSON.stringify({ ok: true, file, frames: meta.frames, fps: meta.nativeFps }))
    return file
  } catch (err) {
    await dumpFail(page, name, size.id, err)
    throw err
  } finally {
    await browser.close()
  }
}

await ensureDirs()
await mkdir(FRAME_DIR, { recursive: true })

for (const size of sizes) {
  for (const name of scenes) {
    if (!PLAY[name]) continue
    await recordScene(size, name)
  }
}

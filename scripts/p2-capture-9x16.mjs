import puppeteer from 'puppeteer-core'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3032'
const tmpRoot = path.join('.tmp-p2', 'frames')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function guide(page) {
  try {
    return await page.evaluate(() => (window.__humoGuide ? window.__humoGuide() : null))
  } catch {
    return null
  }
}

async function dragPath(page, pts) {
  if (!pts?.length) return
  await page.mouse.move(pts[0].x, pts[0].y)
  await page.mouse.down()
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const steps = 3
    for (let s = 1; s <= steps; s++) {
      await page.mouse.move(a.x + ((b.x - a.x) * s) / steps, a.y + ((b.y - a.y) * s) / steps)
      await sleep(14)
    }
  }
  await sleep(70)
  await page.mouse.up()
}

async function waitPainted(page) {
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || ''
      if (text.includes('Cargando')) return false
      return Boolean(document.querySelector('canvas'))
    },
    { timeout: 20000 },
  )
}

async function followGuide(page) {
  for (let n = 0; n < 25; n++) {
    const g = await guide(page)
    if (g?.path?.length >= 2 && g.phase === 'play' && g.t >= 4000) {
      await dragPath(page, g.path)
      return
    }
    await sleep(80)
  }
}

async function recordClip({ name, url, seconds, fps, prep, act, w = 390, h = 844 }) {
  const dir = path.join(tmpRoot, name)
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForSelector('canvas', { timeout: 20000 })
  await waitPainted(page)
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((n) => n.remove()))
  if (prep) await prep(page)
  const total = Math.round(seconds * fps)
  const interval = 1000 / fps
  const actor = act(page)
  let i = 0
  const t0 = Date.now()
  while (i < total) {
    await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 72 })
    i++
    const wait = t0 + i * interval - Date.now()
    if (wait > 8) await sleep(wait)
  }
  await actor.catch((err) => console.warn(name, 'act', err instanceof Error ? err.message : err))
  await browser.close()
  console.log('frames', name, total)
}

const only = process.argv[2]

if (!only || only === 'clutch') await recordClip({
  name: 'aura-antes-del-humo-clutch-9x16',
  url: `${origin}/jugar`,
  seconds: 12,
  fps: 10,
  prep: async (page) => {
    await page.waitForFunction(() => document.body.innerText.includes('JUGÁ 40 S'), { timeout: 12000 })
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('JUG'))?.click())
    await sleep(4500)
  },
  act: async (page) => {
    await sleep(120)
    const g = await guide(page)
    if (g?.path?.length >= 2) await dragPath(page, g.path)
    else await page.keyboard.press('Enter')
  },
})

if (!only || only === 'revancha') await recordClip({
  name: 'aura-antes-del-humo-revancha-9x16',
  url: `${origin}/jugar?shot=end-miss`,
  seconds: 12,
  fps: 10,
  prep: async (page) => {
    await page.waitForFunction(() => document.body.innerText.includes('OTRA RUTA'), { timeout: 15000 })
    await page.evaluate(() => {
      window.setTimeout(() => {
        const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('OTRA'))
        btn?.click()
      }, 1800)
    })
  },
  act: async (page) => {
    await sleep(7200)
    const g = await guide(page)
    if (g?.path?.length >= 2) await dragPath(page, g.path)
    else await page.keyboard.press('Enter')
  },
})

if (!only || only === 'loop') await recordClip({
  name: 'aura-antes-del-humo-loop-16x9',
  url: `${origin}/jugar?demo=1`,
  seconds: 13,
  fps: 8,
  w: 1920,
  h: 1080,
  prep: async () => sleep(1800),
  act: async () => {},
})

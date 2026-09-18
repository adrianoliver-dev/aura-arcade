import puppeteer from 'puppeteer-core'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3032'
const tmpRoot = path.join('.tmp-p2', 'frames')
const outDir = path.join('public', 'trailers', 'final')

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= 16; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 16, from.y + ((to.y - from.y) * i) / 16)
    await sleep(16)
  }
  await page.mouse.up()
}

async function auraFire(page) {
  return page.evaluate(() => {
    const c = document.querySelector('canvas')
    const ctx = c.getContext('2d')
    const w = c.width
    const h = c.height
    const data = ctx.getImageData(0, 0, w, h).data
    let minX = w
    let minY = h
    let maxX = 0
    let maxY = 0
    let n = 0
    let fx = 0
    let fy = 0
    let fn = 0
    for (let y = 0; y < h; y += 3) {
      for (let x = 0; x < w; x += 3) {
        const i = (y * w + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        if (g > 150 && r < 90 && b < 130) {
          n++
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
        if (r > 200 && g < 140 && b < 90) {
          fn++
          fx += x
          fy += y
        }
      }
    }
    if (!n) return { from: { x: 70, y: h * 0.78 }, to: { x: w * 0.58, y: h * 0.42 } }
    return { from: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, to: fn ? { x: fx / fn, y: fy / fn } : { x: w * 0.58, y: h * 0.42 } }
  })
}

async function grab(page, dir, i) {
  const file = path.join(dir, `f${String(i).padStart(4, '0')}.jpg`)
  await page.screenshot({ path: file, type: 'jpeg', quality: 78 })
}

async function recordClip({ name, w, h, url, seconds, fps, act }) {
  const dir = path.join(tmpRoot, name)
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new' })
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForSelector('canvas', { timeout: 20000 })
  await sleep(1800)
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((n) => n.remove()))
  const total = Math.round(seconds * fps)
  const interval = 1000 / fps
  const actor = act ? act(page) : Promise.resolve()
  let i = 0
  const t0 = Date.now()
  while (i < total) {
    await grab(page, dir, i)
    i++
    const target = t0 + i * interval
    const wait = target - Date.now()
    if (wait > 8) await sleep(wait)
  }
  await actor.catch(() => {})
  await browser.close()
  const out = path.join(outDir, `${name}.mp4`)
  const font = 'C\\\\:/Windows/Fonts/arial.ttf'
  const overlay =
    name.includes('loop')
      ? `drawtext=fontfile=${font}:text='ESCANEÁ Y JUGÁ':fontcolor=0xF4E7CF:fontsize=48:x=(w-text_w)/2:y=h-90:enable='gte(t,${seconds - 3})'`
      : name.includes('revancha')
        ? `drawtext=fontfile=${font}:text='OTRA RUTA':fontcolor=0x19C37D:fontsize=42:x=(w-text_w)/2:y=80:enable='lt(t,3)'`
        : `drawtext=fontfile=${font}:text='ANTES DEL HUMO':fontcolor=0xF4E7CF:fontsize=36:x=(w-text_w)/2:y=70:enable='lt(t,2)'`
  await mkdir(outDir, { recursive: true })
  await exec('ffmpeg', [
    '-y',
    '-framerate',
    String(fps),
    '-i',
    path.join(dir, 'f%04d.jpg'),
    '-f',
    'lavfi',
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-vf',
    overlay,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-shortest',
    '-movflags',
    '+faststart',
    out,
  ])
  console.log('wrote', out)
}

await mkdir(outDir, { recursive: true })
await recordClip({
  name: 'aura-antes-del-humo-loop-16x9',
  w: 1920,
  h: 1080,
  url: `${origin}/jugar?demo=1`,
  seconds: 13,
  fps: 12,
})
await recordClip({
  name: 'aura-antes-del-humo-clutch-9x16',
  w: 1080,
  h: 1920,
  url: `${origin}/jugar`,
  seconds: 12,
  fps: 12,
  act: async (page) => {
    await sleep(400)
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('JUG'))?.click())
    await sleep(4500)
    const pts = await auraFire(page)
    await drag(page, pts.from, pts.to)
  },
})
await recordClip({
  name: 'aura-antes-del-humo-revancha-9x16',
  w: 1080,
  h: 1920,
  url: `${origin}/jugar?shot=end-miss`,
  seconds: 12,
  fps: 12,
  act: async (page) => {
    await page.waitForFunction(() => document.body.innerText.includes('OTRA RUTA'), { timeout: 15000 })
    await sleep(1600)
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('OTRA'))?.click())
    await sleep(4500)
    const pts = await auraFire(page)
    await drag(page, pts.from, pts.to)
  },
})

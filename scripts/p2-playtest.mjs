import puppeteer from 'puppeteer-core'
import { appendFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3032'
const logPath = path.join('docs', 'playtest', 'P2-PLAYTEST-LOG.md')
const minutes = Number(process.env.P2_PLAYTEST_MIN || 32)

function stamp() {
  return new Date().toISOString()
}

async function log(line) {
  await appendFile(logPath, `${line}\n`, 'utf8')
  console.log(line)
}

async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let i = 1; i <= 16; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 16, from.y + ((to.y - from.y) * i) / 16)
    await new Promise((r) => setTimeout(r, 16))
  }
  await page.mouse.up()
}

async function auraFire(page) {
  return page.evaluate(() => {
    const c = document.querySelector('canvas')
    if (!c) return null
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
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
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
    if (!n) return null
    return { from: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }, to: fn ? { x: fx / fn, y: fy / fn } : { x: w * 0.62, y: h * 0.42 } }
  })
}

await mkdir(path.dirname(logPath), { recursive: true })
const hash = process.env.P2_BUILD_HASH || 'working-tree'
await writeFile(
  logPath,
  `# P2 playtest log\n\n- Inicio: ${stamp()}\n- Build: ${hash}\n- Origen: ${origin}\n- Objetivo: ${minutes} min de juego real (no batería de seeds)\n\n`,
  'utf8',
)

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const started = Date.now()
let round = 0
try {
  while (Date.now() - started < minutes * 60 * 1000) {
    round++
    const variant = round % 6
    const viewport = variant === 4 ? { width: 1920, height: 1080 } : { width: 390, height: 844 }
    const reduced = variant === 5
    const missFirst = variant === 2
    try {
    const page = await browser.newPage()
    await page.setViewport({ ...viewport, deviceScaleFactor: 1 })
    if (reduced) {
      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    }
    await page.goto(`${origin}/jugar`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('canvas', { timeout: 20000 })
    if (variant === 3) {
      await page.evaluate(() => localStorage.setItem('pulso:muted', '1'))
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForSelector('canvas', { timeout: 20000 })
    }
    await page.waitForFunction(() => document.body.innerText.includes('JUGÁ 40 S'), { timeout: 25000 })
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('JUG'))?.click())
    if (!missFirst) {
      await new Promise((r) => setTimeout(r, 4300))
      const pts = await auraFire(page)
      if (pts) await drag(page, pts.from, pts.to)
    } else {
      await new Promise((r) => setTimeout(r, 11000))
      const pts = await auraFire(page)
      if (pts) await drag(page, pts.from, pts.to)
    }
    await page.waitForFunction(() => document.body.innerText.includes('OTRA RUTA'), { timeout: 45000 })
    const body = await page.evaluate(() => document.body.innerText.slice(0, 400))
    const elapsed = Math.round((Date.now() - started) / 1000)
    await log(
      `- ${stamp()} ronda ${round} ${viewport.width}x${viewport.height} mute=${variant === 3} reduced=${reduced} missCasa=${missFirst} t+${elapsed}s\n  hallazgo: ${body.replace(/\s+/g, ' ').slice(0, 220)}`,
    )
    await page.close()
    } catch (err) {
      await log(`- ${stamp()} ronda ${round} ERROR ${err instanceof Error ? err.message : String(err)}`)
      try {
        const pages = await browser.pages()
        await Promise.all(pages.map((p) => p.close().catch(() => {})))
      } catch {
        /* ignore */
      }
    }
  }
} finally {
  await log(`\n- Fin: ${stamp()} rondas=${round} duración_s=${Math.round((Date.now() - started) / 1000)}`)
  await browser.close()
}

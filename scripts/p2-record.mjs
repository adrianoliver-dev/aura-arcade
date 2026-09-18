import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3032'
const outDir = path.join('public', 'trailers', 'final')

async function record(name, w, h, url, seconds, play) {
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: [`--window-size=${w},${h}`, '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForSelector('canvas', { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 2200))
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((n) => n.remove()))
  await page.exposeFunction('__humoRecDone', () => {})
  await page.evaluate(async (secs, file) => {
    const canvas = document.querySelector('canvas')
    if (!canvas) throw new Error('canvas')
    const stream = canvas.captureStream(30)
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' })
    const chunks = []
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    const stopped = new Promise((resolve) => {
      rec.onstop = () => resolve(null)
    })
    rec.start(200)
    window.__humoRecorder = rec
    window.__humoChunks = chunks
    window.__humoStopped = stopped
    void file
    void secs
  }, seconds, name)
  if (play) await play(page)
  await new Promise((r) => setTimeout(r, seconds * 1000))
  const buf = await page.evaluate(async () => {
    const rec = window.__humoRecorder
    rec.stop()
    await window.__humoStopped
    const blob = new Blob(window.__humoChunks, { type: 'video/webm' })
    const ab = await blob.arrayBuffer()
    return Array.from(new Uint8Array(ab))
  })
  await mkdir(outDir, { recursive: true })
  const { writeFile } = await import('node:fs/promises')
  await writeFile(path.join(outDir, name), Buffer.from(buf))
  await browser.close()
  console.log('ok', name, buf.length)
}

function drag(page, from, to) {
  return page.mouse.move(from.x, from.y).then(async () => {
    await page.mouse.down()
    const steps = 18
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(from.x + ((to.x - from.x) * i) / steps, from.y + ((to.y - from.y) * i) / steps)
      await new Promise((r) => setTimeout(r, 18))
    }
    await page.mouse.up()
  })
}

async function findAuraAndFire(page) {
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
    return {
      from: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
      to: fn ? { x: fx / fn, y: fy / fn } : { x: w * 0.6, y: h * 0.4 },
    }
  })
}

await mkdir(outDir, { recursive: true })
await record('humo-loop.webm', 1920, 1080, `${origin}/jugar?demo=1`, 14, async (page) => {
  const btn = await page.$('button')
  const play = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('JUG')))
  if (play) await play.asElement()?.click()
  void btn
})
await record('humo-clutch.webm', 1080, 1920, `${origin}/jugar`, 12, async (page) => {
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => (b.textContent || '').includes('JUG')), { timeout: 10000 })
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('JUG'))?.click())
  await new Promise((r) => setTimeout(r, 4500))
  const pts = await findAuraAndFire(page)
  await drag(page, pts.from, pts.to)
})
await record('humo-revancha.webm', 1080, 1920, `${origin}/jugar?shot=end-miss`, 12, async (page) => {
  await page.waitForFunction(() => document.body.innerText.includes('OTRA RUTA'), { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 1800))
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('OTRA'))?.click())
  await new Promise((r) => setTimeout(r, 4500))
  const pts = await findAuraAndFire(page)
  await drag(page, pts.from, pts.to)
})

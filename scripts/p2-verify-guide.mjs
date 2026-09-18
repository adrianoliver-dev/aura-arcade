import puppeteer from 'puppeteer-core'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3032'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new' })
const results = []
try {
  for (const label of ['novato-guia', 'mute', 'kiosk-1920']) {
    const page = await browser.newPage()
    const viewport = label === 'kiosk-1920' ? { width: 1920, height: 1080 } : { width: 390, height: 844 }
    await page.setViewport({ ...viewport, deviceScaleFactor: 1 })
    await page.goto(`${origin}/jugar`, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForSelector('canvas', { timeout: 15000 })
    if (label === 'mute') {
      await page.evaluate(() => localStorage.setItem('pulso:muted', '1'))
      await page.reload({ waitUntil: 'domcontentloaded' })
      await page.waitForSelector('canvas', { timeout: 15000 })
    }
    await page.waitForFunction(() => (document.body.innerText || '').includes('JUGÁ 40 S'), { timeout: 15000 })
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('JUG'))?.click())
    await sleep(4600)
    const g = await page.evaluate(() => (window.__humoGuide ? window.__humoGuide() : null))
    if (g?.path?.length) {
      await page.mouse.move(g.path[0].x, g.path[0].y)
      await page.mouse.down()
      for (const pt of g.path.slice(1)) {
        await page.mouse.move(pt.x, pt.y)
        await sleep(20)
      }
      await page.mouse.up()
    }
    await sleep(1800)
    const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 280))
    results.push({ label, viewport, guide: Boolean(g?.path), t: g?.t, body })
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(JSON.stringify(results, null, 2))

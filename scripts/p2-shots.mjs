import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const chrome =
  process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const dir = path.join('docs', 'polish', 'design-review')
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3032'

async function shot(browser, name, w, h, url, waitText, extraMs = 800) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
  await page.waitForSelector('canvas', { timeout: 15000 })
  if (waitText) {
    await page.waitForFunction(
      (text) => document.body && document.body.innerText.includes(text),
      { timeout: 18000 },
      waitText,
    )
  }
  await new Promise((r) => setTimeout(r, extraMs))
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((node) => node.remove())
  })
  await page.screenshot({ path: path.join(dir, name), type: 'png' })
  await page.close()
  console.log('ok', name)
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-gpu'],
})
await mkdir(dir, { recursive: true })
try {
  await shot(browser, 'ready-390.png', 390, 844, `${origin}/jugar?shot=ready`, 'JUGÁ 40 S', 400)
  await shot(browser, 'action-390.png', 390, 844, `${origin}/jugar?shot=action`, null, 5200)
  await shot(browser, 'save-390.png', 390, 844, `${origin}/jugar?shot=save`, null, 4200)
  await shot(browser, 'end-win-390.png', 390, 844, `${origin}/jugar?shot=end-win`, 'OTRA RUTA', 800)
  await shot(browser, 'end-miss-390.png', 390, 844, `${origin}/jugar?shot=end-miss`, 'OTRA RUTA', 800)
  await shot(browser, 'gameplay-1920x1080.png', 1920, 1080, `${origin}/jugar?shot=action`, null, 5200)
  await shot(browser, 'attract-1920x1080.png', 1920, 1080, `${origin}/loop`, 'ESCANEÁ', 5000)
} finally {
  await browser.close()
}

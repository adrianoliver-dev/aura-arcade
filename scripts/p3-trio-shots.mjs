import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import puppeteer from 'puppeteer-core'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3034'
const out = path.join('docs', 'polish', 'design-review', 'p3-trio')
const mode = process.env.P3_SHOTS || 'all'

async function open(browser, viewport, url) {
  const page = await browser.newPage()
  await page.setViewport({ ...viewport, deviceScaleFactor: 1, isMobile: viewport.width < 600, hasTouch: viewport.width < 600 })
  await page.goto(`${origin}${url}`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
  await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((node) => node.remove()))
  return page
}

async function save(page, name) {
  await page.screenshot({ path: path.join(out, name), type: 'png' })
  console.log('ok', name)
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
})

await mkdir(out, { recursive: true })

try {
  const phone = { width: 390, height: 844 }
  const kiosk = { width: 1920, height: 1080 }
  let page

  if (mode === 'all' || mode === 'phone') {
    page = await open(browser, phone, '/lab')
    await save(page, 'sala-390.png')
    await page.close()

    page = await open(browser, phone, '/jugar?shot=ready')
    await page.waitForFunction(() => document.body.innerText.includes('JUGÁ 40 S'), { timeout: 20_000 })
    await save(page, 'humo-ready-390.png')
    await page.close()

    page = await open(browser, phone, '/lab/anillos')
    await page.waitForSelector('button[aria-label*="FRENÁ LA BRASA"]', { timeout: 20_000 })
    await save(page, 'pulso-ready-390.png')
    await page.click('button[aria-label*="FRENÁ LA BRASA"]')
    await new Promise((resolve) => setTimeout(resolve, 2_100))
    await save(page, 'pulso-action-390.png')
    await page.close()

    page = await open(browser, phone, '/lab/radio')
    await page.waitForSelector('button[aria-label*="El predio llama"]', { timeout: 20_000 })
    await save(page, 'radio-ready-390.png')
    await page.click('button[aria-label*="El predio llama"]')
    await new Promise((resolve) => setTimeout(resolve, 1_850))
    await save(page, 'radio-action-390.png')
    await page.close()
  }

  if (mode === 'all' || mode === 'desktop' || mode === 'pulso-desktop') {
    page = await open(browser, kiosk, '/lab/anillos')
    await page.waitForSelector('button[aria-label*="FRENÁ LA BRASA"]', { timeout: 20_000 })
    await page.click('button[aria-label*="FRENÁ LA BRASA"]')
    await new Promise((resolve) => setTimeout(resolve, 2_100))
    await save(page, 'pulso-action-1920.png')
    await page.close()

  }

  if (mode === 'all' || mode === 'desktop' || mode === 'radio-desktop') {
    page = await open(browser, kiosk, '/lab/radio')
    await page.waitForSelector('button[aria-label*="El predio llama"]', { timeout: 20_000 })
    await page.click('button[aria-label*="El predio llama"]')
    await new Promise((resolve) => setTimeout(resolve, 1_850))
    await save(page, 'radio-action-1920.png')
    await page.close()
  }
} finally {
  await browser.close()
}

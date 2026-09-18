import assert from 'node:assert/strict'
import path from 'node:path'

import puppeteer from 'puppeteer-core'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3038'
const out = path.join('docs', 'polish', 'design-review', 'p3-trio', 'pulso-tap-pass-390.png')

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  await page.goto(`${origin}/lab/anillos`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
  await page.waitForSelector('button[aria-label*="FRENÁ LA BRASA"]', { timeout: 20_000 })
  await page.evaluate(() => {
    window.__pulsoNow = false
    const original = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillText = function patched(text, ...args) {
      if (text === '¡AHORA!') window.__pulsoNow = true
      return original.call(this, text, ...args)
    }
  })
  await page.click('button[aria-label*="FRENÁ LA BRASA"]')
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.waitForFunction(() => window.__pulsoNow === true, { timeout: 8_000 })
    await page.click('canvas')
    await new Promise((resolve) => setTimeout(resolve, 140))
    const scored = await page.evaluate(() => [...document.querySelectorAll('p')].some((p) => /^\d+$/.test(p.textContent?.trim() || '') && Number(p.textContent) > 0))
    if (scored) break
    // El aro se reinicia ante un toque en vacío: esperamos una ventana nueva,
    // no reutilizamos el fotograma anterior de “¡AHORA!”.
    await page.evaluate(() => {
      window.__pulsoNow = false
    })
  }
  await page.waitForFunction(() => [...document.querySelectorAll('p')].some((p) => /^\d+$/.test(p.textContent?.trim() || '') && Number(p.textContent) > 0), { timeout: 3_000 })
  const score = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll('p')].map((p) => Number(p.textContent?.trim())).filter(Number.isFinite)))
  assert.ok(score > 0, `el toque al ver ¡AHORA! debe puntuar, obtuvo ${score}`)
  await page.screenshot({ path: out, type: 'png' })
  console.log(JSON.stringify({ pass: true, score, shot: out }))
} finally {
  await browser.close()
}

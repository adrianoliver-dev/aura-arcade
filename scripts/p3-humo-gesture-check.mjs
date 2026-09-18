import assert from 'node:assert/strict'
import path from 'node:path'

import puppeteer from 'puppeteer-core'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3037'
const out = path.join('docs', 'polish', 'design-review', 'p3-trio', 'humo-gesture-pass-390.png')

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  await page.goto(`${origin}/jugar`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
  await page.waitForFunction(() => document.body.innerText.includes('JUGÁ 40 S'), { timeout: 20_000 })

  const start = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes('JUGÁ 40 S')))
  await start.click()
  await page.waitForFunction(() => typeof window.__humoGuide === 'function' && window.__humoGuide()?.phase === 'play', { timeout: 8_000 })

  // Un fallo común debe dar una instrucción visible, no una línea que parece rota.
  await page.mouse.click(15, 310)
  await page.waitForFunction(() => document.body.innerText.includes('EMPEZÁ SOBRE LA BASE VERDE'), { timeout: 2_000 })

  const guide = await page.evaluate(() => window.__humoGuide?.())
  assert.ok(guide, 'el juego expone una base y un foco activos')
  await page.mouse.move(guide.from.x, guide.from.y)
  await page.mouse.down()
  await page.mouse.move(guide.to.x, guide.to.y, { steps: 10 })
  await page.mouse.up()

  await page.waitForFunction(() => /\b[1-9]\d* ha\b/.test(document.body.innerText), { timeout: 3_000 })
  const score = await page.evaluate(() => {
    const match = document.body.innerText.match(/\b(\d+) ha\b/)
    return match ? Number(match[1]) : 0
  })
  assert.ok(score > 0, `el gesto válido tiene que proteger ha, obtuvo ${score}`)
  await page.screenshot({ path: out, type: 'png' })
  console.log(JSON.stringify({ pass: true, score, shot: out }))
} finally {
  await browser.close()
}

import assert from 'node:assert/strict'
import path from 'node:path'

import puppeteer from 'puppeteer-core'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3038'
const out = path.join('docs', 'polish', 'design-review', 'p3-trio', 'radio-decision-pass-390.png')

function actionFor(text) {
  const clue = text.toLowerCase()
  if (/gente|persona|familia|escuela|peones|evacu|animales/.test(clue)) return 'EVACUÁ'
  if (/cort|línea de fuego|camino los une|puente/.test(clue)) return 'CORTE'
  return 'AGUA'
}

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  await page.goto(`${origin}/lab/radio`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
  await page.waitForSelector('button[aria-label*="El predio llama"]', { timeout: 20_000 })
  await page.click('button[aria-label*="El predio llama"]')
  await page.waitForFunction(() => document.body.innerText.includes('PISTA:'), { timeout: 8_000 })

  const clue = await page.evaluate(
    () => [...document.querySelectorAll('p')].find((paragraph) => paragraph.textContent?.trim().startsWith('PISTA:'))?.textContent ?? '',
  )
  assert.ok(clue, 'la tarjeta debe exponer una pista concreta')
  const action = actionFor(clue)
  const choice = await page.evaluateHandle((label) => [...document.querySelectorAll('button')].find((button) => button.textContent?.includes(label)), action)
  assert.ok(choice, `no se encontró acción ${action}`)
  await choice.click()
  await page.waitForFunction(() => document.body.innerText.includes('¡SÍ!'), { timeout: 2_000 })
  await page.screenshot({ path: out, type: 'png' })
  console.log(JSON.stringify({ pass: true, action, shot: out }))
} finally {
  await browser.close()
}

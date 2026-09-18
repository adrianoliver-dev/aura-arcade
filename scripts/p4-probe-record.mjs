import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3040'
const outDir = path.join('.tmp-p4', 'probe')
await mkdir(outDir, { recursive: true })
const out = path.join(outDir, 'cdp-record.mp4')

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--window-size=1280,720'],
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 })
  await page.goto(`${origin}/jugar`, { waitUntil: 'domcontentloaded', timeout: 20_000 })
  await page.waitForSelector('button', { timeout: 15_000 })
  let rec
  try {
    rec = await page.record({ path: out, fps: 60, audio: true, maxWidth: 1280, maxHeight: 720 })
    console.log('record-started-audio')
  } catch (err) {
    console.log('audio-fail', err.message)
    rec = await page.record({ path: out, fps: 60, audio: false, maxWidth: 1280, maxHeight: 720 })
    console.log('record-started-silent')
  }
  await new Promise((r) => setTimeout(r, 1800))
  await rec.stop()
  console.log('ok', out)
} finally {
  await browser.close()
}

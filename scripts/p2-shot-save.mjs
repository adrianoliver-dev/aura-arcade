import puppeteer from 'puppeteer-core'
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
await page.goto('http://127.0.0.1:3032/jugar?shot=save', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('canvas')
await new Promise((r) => setTimeout(r, 6000))
await page.evaluate(() => document.querySelectorAll('nextjs-portal').forEach((n) => n.remove()))
await page.screenshot({ path: 'docs/polish/design-review/save-390.png' })
await browser.close()
console.log('save recaptured')

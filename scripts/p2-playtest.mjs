import puppeteer from 'puppeteer-core'
import { appendFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const origin = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3032'
const logPath = path.join('docs', 'playtest', 'P2-PLAYTEST-LOG.md')
const minutes = Number(process.env.P2_PLAYTEST_MIN || 32)

function stamp() {
  return new Date().toISOString()
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function log(line) {
  await appendFile(logPath, `${line}\n`, 'utf8')
  console.log(line)
}

async function gitHash() {
  try {
    const { stdout } = await exec('git', ['rev-parse', '--short', 'HEAD'])
    return stdout.trim()
  } catch {
    return 'working-tree'
  }
}

async function guide(page) {
  try {
    return await page.evaluate(() => (window.__humoGuide ? window.__humoGuide() : null))
  } catch {
    return null
  }
}

async function dragPath(page, pts) {
  if (!pts?.length) return
  await page.mouse.move(pts[0].x, pts[0].y)
  await page.mouse.down()
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const steps = 4
    for (let s = 1; s <= steps; s++) {
      await page.mouse.move(a.x + ((b.x - a.x) * s) / steps, a.y + ((b.y - a.y) * s) / steps)
      await sleep(12)
    }
  }
  await sleep(80)
  await page.mouse.up()
}

async function waitPlay(page) {
  for (let i = 0; i < 40; i++) {
    const g = await guide(page)
    if (g?.phase === 'play' && g.t >= 4000 && g.path?.length >= 2) return g
    await sleep(120)
  }
  return guide(page)
}

async function playRound(page, missCasa) {
  await page.waitForFunction(() => document.body.innerText.includes('JUGÁ 40 S'), { timeout: 20000 })
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => (b.textContent || '').includes('JUG'))?.click())
  if (missCasa) {
    await sleep(11000)
  } else {
    await sleep(4200)
    const g = await waitPlay(page)
    if (g?.path?.length >= 2) await dragPath(page, g.path)
  }
  await sleep(11000)
  const g2 = await guide(page)
  if (g2?.phase === 'play' && g2.path?.length >= 2) await dragPath(page, g2.path)
  await sleep(12500)
  const g3 = await guide(page)
  if (g3?.phase === 'play' && g3.path?.length >= 2) await dragPath(page, g3.path)
  await page.waitForFunction(() => document.body.innerText.includes('OTRA RUTA'), { timeout: 22000 })
  return page.evaluate(() => document.body.innerText.slice(0, 420))
}

await mkdir(path.dirname(logPath), { recursive: true })
let existing = ''
try {
  existing = await readFile(logPath, 'utf8')
} catch {
  existing = '# P2 playtest log\n\n'
  await appendFile(logPath, existing, 'utf8')
}

const hash = process.env.P2_BUILD_HASH || (await gitHash())
await log(`\n## Sesión rewrite ${stamp()}\n`)
await log(`- Build: ${hash} (working tree post-diorama)`)
await log(`- Origen: ${origin}`)
await log(`- Objetivo: ${minutes} min. Guía CSS \`__humoGuide\`. Tres pulsos salvo missCasa.`)
await log('')

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
      const body = await playRound(page, missFirst)
      const elapsed = Math.round((Date.now() - started) / 1000)
      await log(
        `- ${stamp()} ronda ${round} ${viewport.width}x${viewport.height} mute=${variant === 3} reduced=${reduced} missCasa=${missFirst} t+${elapsed}s\n  hallazgo: ${body.replace(/\s+/g, ' ').slice(0, 240)}`,
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
  await log(`\n- Fin sesión: ${stamp()} rondas=${round} duración_s=${Math.round((Date.now() - started) / 1000)}`)
  await browser.close()
}

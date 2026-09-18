import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import puppeteer from 'puppeteer-core'

export const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
export const ORIGIN = process.env.ARCADE_ORIGIN || 'http://127.0.0.1:3040'
export const RAW_DIR = path.join('.tmp-p4', 'raw')
export const FRAME_DIR = path.join('docs', 'video', 'p4', 'frames')
export const OUT_DIR = path.join('public', 'trailers', 'p4')

export async function ensureDirs() {
  await mkdir(RAW_DIR, { recursive: true })
  await mkdir(FRAME_DIR, { recursive: true })
  await mkdir(OUT_DIR, { recursive: true })
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function hideChrome(page) {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal, [data-nextjs-dialog-overlay]').forEach((node) => node.remove())
    if (document.getElementById('p4-capture-css')) return
    const style = document.createElement('style')
    style.id = 'p4-capture-css'
    style.textContent = '*{cursor:none !important} html,body{overflow:hidden !important}'
    document.documentElement.appendChild(style)
  })
}

export async function showPlate(page, text) {
  await page.evaluate((line) => {
    let el = document.getElementById('p4-plate')
    if (!el) {
      el = document.createElement('div')
      el.id = 'p4-plate'
      el.style.cssText = [
        'position:fixed',
        'left:4%',
        'bottom:7%',
        'z-index:90',
        'pointer-events:none',
        'font-family:var(--font-display), Barlow Condensed, sans-serif',
        'font-weight:800',
        'font-size:clamp(28px,5.4vw,76px)',
        'letter-spacing:0.06em',
        'color:#F4E7CF',
        'text-shadow:0 2px 16px #0D1210, 0 0 18px #C45A21',
        'max-width:90%',
        'transition:opacity 120ms linear',
      ].join(';')
      document.body.appendChild(el)
    }
    el.textContent = line || ''
    el.style.opacity = line ? '1' : '0'
  }, text)
}

export async function launchPage(width, height) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    defaultViewport: { width, height, deviceScaleFactor: 1 },
    args: [
      `--window-size=${width},${height}`,
      '--hide-scrollbars',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-infobars',
      '--use-gl=angle',
      '--mute-audio=false',
    ],
  })
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  return { browser, page }
}

export async function startScreencast(page, { width, height, quality = 86 }) {
  const client = await page.createCDPSession()
  const frames = []
  const t0 = Date.now()
  client.on('Page.screencastFrame', async (frame) => {
    frames.push({ t: (Date.now() - t0) / 1000, data: frame.data })
    try {
      await client.send('Page.screencastFrameAck', { sessionId: frame.sessionId })
    } catch {
      /* closed */
    }
  })
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality,
    everyNthFrame: 1,
    maxWidth: width,
    maxHeight: height,
  })
  return {
    t0,
    frames,
    stop: async () => {
      try {
        await client.send('Page.stopScreencast')
      } catch {
        /* */
      }
    },
  }
}

export async function framesToMp4(frames, file, fps = 60) {
  if (frames.length < 8) throw new Error(`pocos frames: ${frames.length}`)
  const dir = path.join('.tmp-p4', 'frames', path.basename(file, '.mp4'))
  await mkdir(dir, { recursive: true })
  const duration = Math.max(frames[frames.length - 1].t - frames[0].t, frames.length / 30)
  const nativeFps = Math.max(12, Math.min(60, frames.length / duration))
  for (let i = 0; i < frames.length; i++) {
    const name = path.join(dir, `f${String(i).padStart(5, '0')}.jpg`)
    await writeFile(name, Buffer.from(frames[i].data, 'base64'))
  }
  await runFfmpeg([
    '-y',
    '-framerate',
    nativeFps.toFixed(3),
    '-start_number',
    '0',
    '-i',
    path.join(dir, 'f%05d.jpg'),
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(fps),
    '-g',
    String(fps),
    '-movflags',
    '+faststart',
    file,
  ])
  return { frames: frames.length, duration, nativeFps }
}

export function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let err = ''
    child.stderr.on('data', (chunk) => {
      err += String(chunk)
    })
    child.on('close', (code) => {
      if (code === 0) resolve(err)
      else reject(new Error(`ffmpeg ${code}: ${err.slice(-1200)}`))
    })
  })
}

export async function saveJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

export function stamp(t0) {
  return Number(((Date.now() - t0) / 1000).toFixed(3))
}

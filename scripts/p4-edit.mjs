import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { FRAME_DIR, OUT_DIR, RAW_DIR, ensureDirs, runFfmpeg, saveJson } from './p4-lib.mjs'

function probe(file) {
  return new Promise((resolve, reject) => {
    const child = spawn('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let out = ''
    let err = ''
    child.stdout.on('data', (c) => {
      out += String(c)
    })
    child.stderr.on('data', (c) => {
      err += String(c)
    })
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(err || `ffprobe ${code}`))
      else resolve(JSON.parse(out))
    })
  })
}

async function loadMeta(name, size) {
  return JSON.parse(await readFile(path.join(RAW_DIR, `${name}-${size}.json`), 'utf8'))
}

function eventTime(meta, cue, fallback = 0.4) {
  const row = (meta.events || []).find((e) => e.cue === cue)
  return row ? Number(row.t) : fallback
}

async function extract(src, dest, start, duration, w, h) {
  await runFfmpeg([
    '-y',
    '-ss',
    Math.max(0, start).toFixed(3),
    '-i',
    src,
    '-t',
    duration.toFixed(3),
    '-vf',
    `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},fps=60`,
    '-an',
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '60',
    dest,
  ])
}

async function concat(parts, dest) {
  const list = path.join('.tmp-p4', `${path.basename(dest, '.mp4')}.txt`)
  await writeFile(list, parts.map((p) => `file '${path.resolve(p).replace(/\\/g, '/')}'`).join('\n'), 'utf8')
  await runFfmpeg([
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    list,
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '16',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '60',
    dest,
  ])
}

async function mixAudio(cues, seconds, dest) {
  const audioDir = path.join('.tmp-p4', 'audio')
  const inputs = ['-y', '-i', path.join(audioDir, 'bed-68-96bpm.wav')]
  const maps = ['[0:a]atrim=0:' + seconds.toFixed(3) + ',asetpts=PTS-STARTPTS,volume=0.42[bed]']
  const mix = ['[bed]']
  let i = 1
  for (const cue of cues) {
    inputs.push('-i', path.join(audioDir, `${cue.file}.wav`))
    const delay = Math.max(0, Math.round(cue.t * 1000))
    maps.push(`[${i}:a]adelay=${delay}|${delay},volume=${cue.vol ?? 1}[s${i}]`)
    mix.push(`[s${i}]`)
    i += 1
  }
  maps.push(`${mix.join('')}amix=inputs=${mix.length}:duration=first:dropout_transition=0,alimiter=limit=0.89[a]`)
  await runFfmpeg([...inputs, '-filter_complex', maps.join(';'), '-map', '[a]', '-t', seconds.toFixed(3), '-ar', '48000', '-ac', '2', dest])
}

async function mux(video, audio, dest, seconds, compatible = false) {
  await runFfmpeg([
    '-y',
    '-i',
    video,
    '-i',
    audio,
    '-t',
    seconds.toFixed(3),
    '-c:v',
    'libx264',
    '-profile:v',
    compatible ? 'main' : 'high',
    '-level',
    compatible ? '4.0' : '4.2',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '60',
    '-g',
    '60',
    '-c:a',
    'aac',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    dest,
  ])
}

function runNode(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file], { stdio: 'inherit' })
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${file} ${code}`))))
  })
}

await ensureDirs()
await mkdir(path.join('.tmp-p4', 'cuts'), { recursive: true })
await runNode(path.join('scripts', 'p4-audio.mjs'))

const humo = await loadMeta('humo', '1920x1080')
const pulso = await loadMeta('pulso', '1920x1080')
const radio = await loadMeta('radio', '1920x1080')
const qr = await loadMeta('qr', '1920x1080')
const humoV = await loadMeta('humo', '1080x1920')
const pulsoV = await loadMeta('pulso', '1080x1920')
const radioV = await loadMeta('radio', '1080x1920')
const qrV = await loadMeta('qr', '1080x1920')

const loopParts = [
  path.join('.tmp-p4', 'cuts', 'loop-humo.mp4'),
  path.join('.tmp-p4', 'cuts', 'loop-pulso.mp4'),
  path.join('.tmp-p4', 'cuts', 'loop-radio.mp4'),
  path.join('.tmp-p4', 'cuts', 'loop-qr.mp4'),
]
await extract(humo.file, loopParts[0], Math.max(0, eventTime(humo, 'humo-grab') - 1.55), 7.5, 1920, 1080)
await extract(pulso.file, loopParts[1], Math.max(0, eventTime(pulso, 'pulso-now') - 0.55), 3.3, 1920, 1080)
await extract(radio.file, loopParts[2], Math.max(0, eventTime(radio, 'radio-clue') - 0.45), 3.2, 1920, 1080)
await extract(qr.file, loopParts[3], 0.12, 4.0, 1920, 1080)
const loopSilent = path.join('.tmp-p4', 'cuts', 'loop-silent.mp4')
await concat(loopParts, loopSilent)
const loopWav = path.join('.tmp-p4', 'audio', 'loop-18.wav')
await mixAudio(
  [
    { t: 1.6, file: 'grab', vol: 1.05 },
    { t: 4.8, file: 'save', vol: 1.15 },
    { t: 8.2, file: 'tick', vol: 0.9 },
    { t: 8.55, file: 'perfect', vol: 1.2 },
    { t: 11.3, file: 'fire', vol: 0.7 },
    { t: 12.2, file: 'si', vol: 1.15 },
  ],
  18,
  loopWav,
)
await mux(loopSilent, loopWav, path.join(OUT_DIR, 'aura-arcade-fexpo-loop-16x9.mp4'), 18)
await mux(loopSilent, loopWav, path.join(OUT_DIR, 'aura-arcade-fexpo-loop-16x9-monitor-safe.mp4'), 18, true)

const clutchHumo = path.join('.tmp-p4', 'cuts', 'clutch-humo.mp4')
const clutchCta = path.join('.tmp-p4', 'cuts', 'clutch-cta.mp4')
const clutchSilent = path.join('.tmp-p4', 'cuts', 'clutch-silent.mp4')
await extract(humoV.file, clutchHumo, Math.max(0, eventTime(humoV, 'humo-grab') - 1.8), 9.5, 1080, 1920)
await extract(qrV.file, clutchCta, 0.1, 2.5, 1080, 1920)
await concat([clutchHumo, clutchCta], clutchSilent)
const clutchWav = path.join('.tmp-p4', 'audio', 'clutch-12.wav')
await mixAudio(
  [
    { t: 1.9, file: 'grab', vol: 1.05 },
    { t: 5.2, file: 'save', vol: 1.2 },
  ],
  12,
  clutchWav,
)
await mux(clutchSilent, clutchWav, path.join(OUT_DIR, 'aura-arcade-clutch-9x16.mp4'), 12)

const trioParts = [
  path.join('.tmp-p4', 'cuts', 'trio-humo.mp4'),
  path.join('.tmp-p4', 'cuts', 'trio-pulso.mp4'),
  path.join('.tmp-p4', 'cuts', 'trio-radio.mp4'),
  path.join('.tmp-p4', 'cuts', 'trio-qr.mp4'),
]
await extract(humoV.file, trioParts[0], Math.max(0, eventTime(humoV, 'humo-grab') - 1.2), 5.0, 1080, 1920)
await extract(pulsoV.file, trioParts[1], Math.max(0, eventTime(pulsoV, 'pulso-now') - 0.5), 4.0, 1080, 1920)
await extract(radioV.file, trioParts[2], Math.max(0, eventTime(radioV, 'radio-clue') - 0.4), 3.0, 1080, 1920)
await extract(qrV.file, trioParts[3], 0.1, 3.0, 1080, 1920)
const trioSilent = path.join('.tmp-p4', 'cuts', 'trio-silent.mp4')
await concat(trioParts, trioSilent)
const trioWav = path.join('.tmp-p4', 'audio', 'trio-15.wav')
await mixAudio(
  [
    { t: 1.5, file: 'grab', vol: 1.05 },
    { t: 3.6, file: 'save', vol: 1.2 },
    { t: 6.3, file: 'tick', vol: 0.9 },
    { t: 6.6, file: 'perfect', vol: 1.2 },
    { t: 9.8, file: 'fire', vol: 0.7 },
    { t: 10.5, file: 'si', vol: 1.15 },
  ],
  15,
  trioWav,
)
await mux(trioSilent, trioWav, path.join(OUT_DIR, 'aura-arcade-trio-9x16.mp4'), 15)

const grabs = {
  'aura-arcade-fexpo-loop-16x9.mp4': [0, 1.5, 5.5, 8, 11, 14, 16, 17.9],
  'aura-arcade-clutch-9x16.mp4': [0, 2, 6, 9, 11.9],
  'aura-arcade-trio-9x16.mp4': [0, 2, 6, 9, 12, 14.9],
}
await mkdir(FRAME_DIR, { recursive: true })
for (const [name, times] of Object.entries(grabs)) {
  const src = path.join(OUT_DIR, name)
  const stem = name.replace('.mp4', '')
  for (const t of times) {
    const dest = path.join(FRAME_DIR, `${stem}-${String(t).replace('.', 'p')}s.png`)
    await runFfmpeg(['-y', '-ss', t.toFixed(2), '-i', src, '-frames:v', '1', dest])
  }
}

const probes = {}
for (const name of [
  'aura-arcade-fexpo-loop-16x9.mp4',
  'aura-arcade-fexpo-loop-16x9-monitor-safe.mp4',
  'aura-arcade-clutch-9x16.mp4',
  'aura-arcade-trio-9x16.mp4',
]) {
  probes[name] = await probe(path.join(OUT_DIR, name))
}
await saveJson(path.join('docs', 'video', 'p4', 'ffprobe.json'), probes)
console.log(JSON.stringify({ ok: true, out: OUT_DIR, frames: FRAME_DIR }))

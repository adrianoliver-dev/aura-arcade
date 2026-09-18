import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const font = "'C\\:/Windows/Fonts/arialbd.ttf'"
const qr = path.join('public', 'qr-arcade.png')
const outDir = path.join('public', 'trailers', 'final')
const grabDir = path.join('docs', 'video', 'final')

async function ffprobe(file) {
  const { stdout } = await exec('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration,size:stream=codec_name,width,height,codec_type',
    '-of',
    'json',
    file,
  ])
  return JSON.parse(stdout)
}

async function encode({ name, inputPattern, fps, overlayText, overlayStart, seconds, scale }) {
  await mkdir(grabDir, { recursive: true })
  const textFile = path.join(grabDir, `${name}-overlay.txt`)
  await writeFile(textFile, overlayText, 'utf8')
  const out = path.join(outDir, `${name}.mp4`)
  const textPath = textFile.replaceAll('\\', '/')
  const vfCore = [
    scale,
    'format=yuv420p',
    'fade=t=in:st=0:d=0.3',
    `fade=t=out:st=${(seconds - 0.4).toFixed(2)}:d=0.35`,
    `drawtext=fontfile=${font}:textfile=${textPath}:fontcolor=0xF4E7CF:fontsize=52:x=(w-text_w)/2:y=h-92:enable='gte(t,${overlayStart})'`,
  ].join(',')
  await mkdir(outDir, { recursive: true })
  await exec('ffmpeg', [
    '-y',
    '-framerate',
    String(fps),
    '-i',
    inputPattern,
    '-loop',
    '1',
    '-t',
    String(seconds),
    '-i',
    qr,
    '-f',
    'lavfi',
    '-t',
    String(seconds),
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=48000',
    '-filter_complex',
    `[0:v]${vfCore}[base];[1:v]scale=200:200[qr];[base][qr]overlay=W-228:40:enable='gte(t,${overlayStart})'[out]`,
    '-map',
    '[out]',
    '-map',
    '2:a',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-shortest',
    '-movflags',
    '+faststart',
    out,
  ])
  const info = await ffprobe(out)
  const dest = path.join(grabDir, name)
  await mkdir(dest, { recursive: true })
  for (const t of [1, Math.max(3, Math.floor(seconds / 2)), Math.max(4, seconds - 1)]) {
    await exec('ffmpeg', ['-y', '-ss', String(t), '-i', out, '-frames:v', '1', path.join(dest, `frame-${t}s.png`)])
  }
  console.log(name, JSON.stringify(info))
}

const only = process.argv[2]

if (!only || only === 'loop') {
  await encode({
    name: 'aura-antes-del-humo-loop-16x9',
    inputPattern: path.join('.tmp-p2', 'frames', 'loop', 'loop-%04d.jpg'),
    fps: 8,
    overlayText: 'ESCANEÁ Y JUGÁ',
    overlayStart: 9,
    seconds: 13,
    scale: 'scale=1920:1080',
  })
}

if (!only || only === 'clutch') {
  await encode({
    name: 'aura-antes-del-humo-clutch-9x16',
    inputPattern: path.join('.tmp-p2', 'frames', 'aura-antes-del-humo-clutch-9x16', 'f%04d.jpg'),
    fps: 10,
    overlayText: 'JUGÁ 40 S',
    overlayStart: 8,
    seconds: 12,
    scale: 'scale=1080:1920:flags=lanczos',
  })
}

if (!only || only === 'revancha') {
  await encode({
    name: 'aura-antes-del-humo-revancha-9x16',
    inputPattern: path.join('.tmp-p2', 'frames', 'aura-antes-del-humo-revancha-9x16', 'f%04d.jpg'),
    fps: 10,
    overlayText: 'OTRA RUTA',
    overlayStart: 0.3,
    seconds: 12,
    scale: 'scale=1080:1920:flags=lanczos',
  })
}

/**
 * Cama 6/8 original para P4 + SFX alineados al synth de HUMO/PULSO.
 * Receta: 96 BPM (negra con puntillo), compás 6/8, mismas funciones
 * Dm add9 / F maj7 / C add9 / G sus2 que `components/humo/humo-audio.ts`.
 * Licencia: composición procedural original Aura Arcade 2026. Sin samples de terceros.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SR = 48_000
const BPM = 96
const EIGHTH = 60 / BPM / 3
const OUT = path.join('.tmp-p4', 'audio')

const BARS = [
  { bass: 146.83, notes: [293.66, 349.23, 440, 349.23, 293.66, 440] },
  { bass: 174.61, notes: [349.23, 440, 523.25, 440, 349.23, 523.25] },
  { bass: 130.81, notes: [261.63, 329.63, 392, 329.63, 261.63, 392] },
  { bass: 196, notes: [392, 493.88, 587.33, 493.88, 392, 587.33] },
]

function mulberry(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(v) {
  return v < -1 ? -1 : v > 1 ? 1 : v
}

function env(t, a, d) {
  if (t < 0) return 0
  if (t < a) return t / a
  const u = (t - a) / d
  if (u >= 1) return 0
  return Math.exp(-4.2 * u)
}

function tri(phase) {
  const x = phase - Math.floor(phase)
  return 1 - 4 * Math.abs(x - 0.5)
}

function mixAt(buf, i, v) {
  if (i >= 0 && i < buf.length) buf[i] += v
}

function renderTone(buf, start, dur, freq, gain, type) {
  const n = Math.floor(dur * SR)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const e = env(t, 0.008, dur)
    const ph = freq * t
    const w = type === 'sine' ? Math.sin(2 * Math.PI * ph) : type === 'saw' ? 2 * (ph - Math.floor(ph)) - 1 : tri(ph)
    mixAt(buf, start + i, w * e * gain)
  }
}

function renderNoise(buf, start, dur, gain, hp, rng) {
  const n = Math.floor(dur * SR)
  let prev = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const e = env(t, 0.004, dur)
    const white = rng() * 2 - 1
    const filtered = white - prev * hp
    prev = white
    mixAt(buf, start + i, filtered * e * gain)
  }
}

function pluck(buf, at, freq, dur, gain) {
  const start = Math.floor(at * SR)
  const n = Math.floor((dur + 0.04) * SR)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const e = env(t, 0.012, dur)
    const a = tri(freq * t)
    const b = Math.sin(2 * Math.PI * freq * 2.01 * t) * 0.35
    mixAt(buf, start + i, (a + b) * e * gain)
  }
}

function thump(buf, at, gain) {
  const start = Math.floor(at * SR)
  const n = Math.floor(0.18 * SR)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const freq = 92 * Math.pow(48 / 92, t / 0.14)
    const e = env(t, 0.006, 0.16)
    mixAt(buf, start + i, Math.sin(2 * Math.PI * freq * t) * e * gain)
  }
}

function shaker(buf, at, gain, rng) {
  const start = Math.floor(at * SR)
  const n = Math.floor(0.06 * SR)
  let lp = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const e = Math.exp(-t / 0.028)
    const white = rng() * 2 - 1
    lp = lp * 0.82 + white * 0.18
    const bp = white - lp
    mixAt(buf, start + i, bp * e * gain)
  }
}

function air(buf, rng) {
  let brown = 0
  for (let i = 0; i < buf.length; i++) {
    brown = clamp(brown + (rng() * 2 - 1) * 0.018)
    const hiss = (rng() * 2 - 1) * 0.012
    const night = Math.sin((i / SR) * 0.35) * 0.004
    buf[i] += brown * 0.045 + hiss * 0.02 + night
  }
}

function limit(buf, peakDb = -1.5) {
  let peak = 1e-9
  for (const s of buf) peak = Math.max(peak, Math.abs(s))
  const target = 10 ** (peakDb / 20)
  const g = peak > target ? target / peak : 1
  if (g !== 1) {
    for (let i = 0; i < buf.length; i++) buf[i] *= g
  }
  return { peak, gain: g, peakDb: 20 * Math.log10(peak * g) }
}

function writeWav(file, left, right = left) {
  const n = left.length
  const data = Buffer.alloc(44 + n * 4)
  data.write('RIFF', 0)
  data.writeUInt32LE(36 + n * 4, 4)
  data.write('WAVE', 8)
  data.write('fmt ', 12)
  data.writeUInt32LE(16, 16)
  data.writeUInt16LE(1, 20)
  data.writeUInt16LE(2, 22)
  data.writeUInt32LE(SR, 24)
  data.writeUInt32LE(SR * 4, 28)
  data.writeUInt16LE(4, 32)
  data.writeUInt16LE(16, 34)
  data.write('data', 36)
  data.writeUInt32LE(n * 4, 40)
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, left[i] ?? 0))
    const r = Math.max(-1, Math.min(1, right[i] ?? l))
    data.writeInt16LE((l * 32767) | 0, 44 + i * 4)
    data.writeInt16LE((r * 32767) | 0, 46 + i * 4)
  }
  return writeFile(file, data)
}

function cue(name, fn) {
  const buf = new Float32Array(Math.floor(SR * 0.6))
  fn(buf)
  limit(buf, -3)
  return { name, buf }
}

await mkdir(OUT, { recursive: true })

const seconds = 24
const bed = new Float32Array(Math.floor(SR * seconds))
const rng = mulberry(0xa11a2026)
air(bed, rng)

let t = 0.06
let bar = 0
while (t < seconds - 1.4) {
  const chord = BARS[bar % BARS.length]
  for (let step = 0; step < 6; step++) {
    const at = t + step * EIGHTH
    shaker(bed, at, step === 0 || step === 3 ? 0.11 : 0.07, rng)
    if (step === 0 || step === 3) thump(bed, at, step === 0 ? 0.38 : 0.26)
    pluck(bed, at + 0.008, chord.notes[step], step === 0 || step === 3 ? 0.2 : 0.14, step === 0 || step === 3 ? 0.22 : 0.14)
  }
  pluck(bed, t, chord.bass, 0.44, 0.16)
  pluck(bed, t + EIGHTH * 3, chord.bass * 1.5, 0.3, 0.1)
  t += EIGHTH * 6
  bar += 1
}

const bedStats = limit(bed, -14)
await writeWav(path.join(OUT, 'bed-68-96bpm.wav'), bed)

const cues = [
  cue('grab', (b) => {
    renderTone(b, 0, 0.07, 196, 0.45, 'tri')
    renderTone(b, Math.floor(0.02 * SR), 0.09, 392, 0.32, 'sine')
  }),
  cue('tick', (b) => renderTone(b, 0, 0.04, 220, 0.22, 'sine')),
  cue('save', (b) => {
    const rng2 = mulberry(7)
    renderNoise(b, 0, 0.12, 0.28, 0.6, rng2)
    renderTone(b, 0, 0.08, 392, 0.42, 'tri')
    renderTone(b, Math.floor(0.05 * SR), 0.12, 523, 0.4, 'tri')
    renderTone(b, Math.floor(0.1 * SR), 0.16, 784, 0.32, 'sine')
  }),
  cue('perfect', (b) => {
    renderTone(b, 0, 0.18, 880, 0.42, 'tri')
    renderTone(b, Math.floor(0.04 * SR), 0.14, 1320, 0.18, 'sine')
  }),
  cue('si', (b) => {
    renderTone(b, 0, 0.08, 392, 0.38, 'tri')
    renderTone(b, Math.floor(0.05 * SR), 0.12, 523, 0.36, 'tri')
    renderTone(b, Math.floor(0.1 * SR), 0.18, 784, 0.3, 'sine')
  }),
  cue('fire', (b) => {
    const rng2 = mulberry(11)
    renderNoise(b, 0, 0.35, 0.22, 0.82, rng2)
    renderTone(b, 0, 0.4, 70, 0.28, 'sine')
  }),
]

for (const c of cues) {
  await writeWav(path.join(OUT, `${c.name}.wav`), c.buf)
}

await writeFile(
  path.join(OUT, 'manifest.json'),
  JSON.stringify(
    {
      bpm: BPM,
      meter: '6/8',
      sampleRate: SR,
      bedPeakDb: bedStats.peakDb,
      source: 'scripts/p4-audio.mjs mirrors components/humo/humo-audio.ts MUSIC_BARS',
      license: 'original Aura Arcade 2026',
    },
    null,
    2,
  ),
)

console.log(JSON.stringify({ ok: true, dir: OUT, bars: bar, bedPeakDb: bedStats.peakDb }))

/** Audio PULSO: mp3 originales + synth de respaldo. Se desbloquea en el primer tap. */

type Sfx = 'tap' | 'perfect' | 'doble' | 'casi' | 'brecha' | 'rush' | 'miss'

const FILES: Record<string, string> = {
  bed: '/pulso/audio/bed.mp3',
  night: '/pulso/audio/night.mp3',
  tap: '/pulso/audio/tap.mp3',
  perfect: '/pulso/audio/perfect.mp3',
  doble: '/pulso/audio/doble.mp3',
  casi: '/pulso/audio/casi.mp3',
  brecha: '/pulso/audio/brecha.mp3',
  rush: '/pulso/audio/rush.mp3',
  miss: '/pulso/audio/miss.mp3',
}

let ctx: AudioContext | null = null
let bedGain: GainNode | null = null
let muted = false
let unlocked = false
let rushPlayed = false
const buffers = new Map<string, AudioBuffer>()
const htmlLoops: HTMLAudioElement[] = []

function context(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

async function decodeFile(name: string, url: string): Promise<void> {
  const audio = context()
  if (!audio) return
  try {
    const res = await fetch(url)
    if (!res.ok) return
    const raw = await res.arrayBuffer()
    const buf = await audio.decodeAudioData(raw.slice(0))
    buffers.set(name, buf)
  } catch {
    /* synth fallback */
  }
}

export async function unlockPulsoAudio(): Promise<void> {
  if (unlocked) return
  unlocked = true
  const audio = context()
  if (!audio) return
  try {
    await audio.resume()
  } catch {
    /* autoplay policy */
  }
  await Promise.all(Object.entries(FILES).map(([name, url]) => decodeFile(name, url)))
  startBed()
}

export function isPulsoMuted(): boolean {
  return muted
}

const MUTE_EVENT = 'pulso-mute'

export function subscribePulsoMute(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(MUTE_EVENT, onStoreChange)
  return () => window.removeEventListener(MUTE_EVENT, onStoreChange)
}

export function getPulsoMuteSnapshot(): boolean {
  try {
    return localStorage.getItem('pulso:muted') === '1'
  } catch {
    return muted
  }
}

export function setPulsoMuted(next: boolean): void {
  muted = next
  try {
    localStorage.setItem('pulso:muted', next ? '1' : '0')
  } catch {
    /* */
  }
  if (bedGain && ctx) {
    bedGain.gain.setTargetAtTime(next ? 0 : 0.26, ctx.currentTime, 0.05)
  }
  for (const el of htmlLoops) el.muted = next
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(MUTE_EVENT))
  }
}

export function loadPulsoMute(): boolean {
  try {
    muted = localStorage.getItem('pulso:muted') === '1'
  } catch {
    muted = false
  }
  return muted
}

function startBed() {
  const audio = context()
  if (!audio || bedGain) return
  bedGain = audio.createGain()
  bedGain.gain.value = muted ? 0 : 0.26
  bedGain.connect(audio.destination)

  const bed = buffers.get('bed')
  const night = buffers.get('night')
  if (bed) loopBuffer(bed, 0.55)
  if (night) loopBuffer(night, 0.28)
  if (!bed && !night) startSynthBed(audio)
}

function loopBuffer(buffer: AudioBuffer, gain: number) {
  const audio = context()
  if (!audio || !bedGain) return
  const src = audio.createBufferSource()
  src.buffer = buffer
  src.loop = true
  const g = audio.createGain()
  g.gain.value = gain
  src.connect(g)
  g.connect(bedGain)
  src.start()
}

function startSynthBed(audio: AudioContext) {
  if (!bedGain) return
  const osc = audio.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 55
  const lfo = audio.createOscillator()
  lfo.frequency.value = 1.35
  const lfoGain = audio.createGain()
  lfoGain.gain.value = 8
  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 180
  osc.connect(filter)
  filter.connect(bedGain)
  osc.start()
  lfo.start()

  const noise = audio.createBufferSource()
  const buf = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.04
  noise.buffer = buf
  noise.loop = true
  const hp = audio.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1800
  const ng = audio.createGain()
  ng.gain.value = 0.12
  noise.connect(hp)
  hp.connect(ng)
  ng.connect(bedGain)
  noise.start()
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.12) {
  const audio = context()
  if (!audio || muted) return
  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur)
  osc.connect(g)
  g.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + dur)
}

function playBuffer(name: string) {
  const audio = context()
  const buf = buffers.get(name)
  if (!audio || !buf || muted) return false
  const src = audio.createBufferSource()
  src.buffer = buf
  const g = audio.createGain()
  g.gain.value = 0.7
  src.connect(g)
  g.connect(audio.destination)
  src.start()
  return true
}

export function playPulsoSfx(kind: Sfx): void {
  if (!unlocked || muted) return
  if (playBuffer(kind)) return
  if (kind === 'perfect') beep(880, 0.18, 'triangle', 0.14)
  else if (kind === 'doble') {
    beep(660, 0.12, 'square', 0.1)
    beep(990, 0.16, 'triangle', 0.1)
  } else if (kind === 'casi') beep(520, 0.1, 'sine', 0.08)
  else if (kind === 'brecha') beep(90, 0.35, 'sawtooth', 0.16)
  else if (kind === 'rush') beep(140, 0.5, 'sawtooth', 0.1)
  else if (kind === 'miss') beep(180, 0.08, 'sine', 0.05)
  else beep(420, 0.05, 'sine', 0.06)
}

export function playPulsoRush(): void {
  if (rushPlayed) return
  rushPlayed = true
  playPulsoSfx('rush')
}

export function resetPulsoRushFlag(): void {
  rushPlayed = false
}

let lastWhoosh = 0

export function playHumoWhoosh(): void {
  if (!unlocked || muted) return
  const now = typeof performance !== 'undefined' ? performance.now() : 0
  if (now - lastWhoosh < 70) return
  lastWhoosh = now
  beep(240 + (now % 110), 0.055, 'sine', 0.055)
}

export function playHumoSave(saved: number): void {
  if (!unlocked || muted) return
  if (playBuffer('perfect')) {
    if (saved >= 20) playBuffer('doble')
    return
  }
  beep(392, 0.08, 'triangle', 0.1)
  beep(523, 0.12, 'triangle', 0.13)
  beep(784, 0.18, 'triangle', 0.12)
  if (saved >= 18) beep(1046, 0.24, 'sine', 0.12)
}

export function playHumoClutch(): void {
  if (!unlocked || muted) return
  beep(110, 0.32, 'sawtooth', 0.12)
  beep(880, 0.1, 'square', 0.07)
  beep(1320, 0.08, 'triangle', 0.05)
}

export function sfxFromKind(kind: string): Sfx {
  if (kind === 'PERFECT') return 'perfect'
  if (kind === 'DOBLE') return 'doble'
  if (kind === 'CASI') return 'casi'
  if (kind === 'BRECHA') return 'brecha'
  if (kind === 'MISS') return 'miss'
  return 'tap'
}

/** Mapa sonoro propio de HUMO. Synth Web Audio — no usa archivos /pulso. */

type HumoCue = 'grab' | 'tick' | 'save' | 'miss' | 'clutch' | 'fire' | 'late'

let ctx: AudioContext | null = null
let bedGain: GainNode | null = null
let compressor: DynamicsCompressorNode | null = null
let unlocked = false
let lastTick = 0
let lastFire = 0
let clutchOn = false

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

function muted(): boolean {
  try {
    return localStorage.getItem('pulso:muted') === '1'
  } catch {
    return false
  }
}

function master(): AudioNode | null {
  const a = audio()
  if (!a) return null
  if (!compressor) {
    compressor = a.createDynamicsCompressor()
    compressor.threshold.value = -18
    compressor.knee.value = 12
    compressor.ratio.value = 3
    compressor.attack.value = 0.01
    compressor.release.value = 0.18
    compressor.connect(a.destination)
  }
  return compressor
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, at = 0) {
  const a = audio()
  const out = master()
  if (!a || !out || muted() || !unlocked) return
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, a.currentTime + at)
  g.gain.setValueAtTime(0.0001, a.currentTime + at)
  g.gain.exponentialRampToValueAtTime(gain, a.currentTime + at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + at + dur)
  osc.connect(g)
  g.connect(out)
  osc.start(a.currentTime + at)
  osc.stop(a.currentTime + at + dur + 0.02)
}

function noise(dur: number, gain: number, hp = 400) {
  const a = audio()
  const out = master()
  if (!a || !out || muted() || !unlocked) return
  const n = a.createBuffer(1, a.sampleRate * dur, a.sampleRate)
  const data = n.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  src.buffer = n
  const filter = a.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = hp
  const g = a.createGain()
  g.gain.setValueAtTime(gain, a.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur)
  src.connect(filter)
  filter.connect(g)
  g.connect(out)
  src.start()
}

export async function unlockHumoAudio(): Promise<void> {
  if (unlocked) return
  unlocked = true
  const a = audio()
  if (!a) return
  try {
    await a.resume()
  } catch {
    /* autoplay */
  }
  startBed()
}

function startBed() {
  const a = audio()
  const out = master()
  if (!a || !out || bedGain) return
  bedGain = a.createGain()
  bedGain.gain.value = 0.028
  const osc = a.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = 62
  const osc2 = a.createOscillator()
  osc2.type = 'triangle'
  osc2.frequency.value = 93
  osc.connect(bedGain)
  osc2.connect(bedGain)
  bedGain.connect(out)
  osc.start()
  osc2.start()
}

export function setHumoBedLevel(on: boolean) {
  if (!bedGain) return
  bedGain.gain.value = on && !muted() ? 0.028 : 0
}

export function playHumoCue(kind: HumoCue): void {
  if (!unlocked || muted()) return
  const now = typeof performance !== 'undefined' ? performance.now() : 0
  if (kind === 'grab') {
    tone(196, 0.07, 'triangle', 0.08)
    tone(392, 0.09, 'sine', 0.06, 0.02)
    return
  }
  if (kind === 'tick') {
    if (now - lastTick < 90) return
    lastTick = now
    tone(210 + (now % 40), 0.04, 'sine', 0.035)
    return
  }
  if (kind === 'save') {
    noise(0.12, 0.04, 800)
    tone(392, 0.08, 'triangle', 0.09)
    tone(523, 0.12, 'triangle', 0.1, 0.05)
    tone(784, 0.16, 'sine', 0.08, 0.1)
    return
  }
  if (kind === 'miss' || kind === 'late') {
    tone(330, 0.1, 'sawtooth', 0.07)
    tone(196, 0.18, 'triangle', 0.08, 0.08)
    tone(110, 0.28, 'sine', 0.07, 0.14)
    return
  }
  if (kind === 'clutch') {
    clutchOn = true
    if (compressor) compressor.ratio.value = 8
    tone(98, 0.4, 'sine', 0.07)
    tone(784, 0.08, 'triangle', 0.05, 0.02)
    window.setTimeout(() => {
      clutchOn = false
      if (compressor) compressor.ratio.value = 3
    }, 900)
    return
  }
  if (kind === 'fire') {
    if (now - lastFire < 1600) return
    lastFire = now
    noise(0.35, 0.03, 200)
    tone(70, 0.4, 'sine', 0.04)
  }
  void clutchOn
}

export const HUMO_SOUND_MAP = {
  grab: 'tick de captura en base verde',
  tick: 'hit de arrastre por distancia, no por frame',
  save: 'ascenso + polvo',
  miss: 'descenso corto',
  clutch: 'compresión + viento bajo',
  fire: 'brasa lejana',
  bed: 'drone 62/93 Hz, más bajo que SFX',
  license: 'original synth, CC0 Aura Arcade 2026',
} as const

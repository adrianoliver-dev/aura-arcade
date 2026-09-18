/** Mapa sonoro original de HUMO. No reutiliza la biblioteca de PULSO. */

type HumoCue = 'grab' | 'tick' | 'save' | 'miss' | 'clutch' | 'fire' | 'late'

let ctx: AudioContext | null = null
let bedGain: GainNode | null = null
let bedFilter: BiquadFilterNode | null = null
let compressor: DynamicsCompressorNode | null = null
let unlocked = false
let lastTick = 0
let lastFire = 0
let clutchOn = false
let musicTimer: number | null = null
let nextBarAt = 0
let barIndex = 0
let bedActive = false

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

function bedDestination(): AudioNode | null {
  const a = audio()
  if (!a || !bedGain || !bedFilter) return null
  return bedGain
}

function bedPluck(freq: number, at: number, dur: number, gain: number) {
  const a = audio()
  const out = bedDestination()
  if (!a || !out) return
  const osc = a.createOscillator()
  const shimmer = a.createOscillator()
  const filter = a.createBiquadFilter()
  const amp = a.createGain()
  osc.type = 'triangle'
  shimmer.type = 'sine'
  osc.frequency.setValueAtTime(freq, at)
  shimmer.frequency.setValueAtTime(freq * 2.01, at)
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2_800, at)
  filter.frequency.exponentialRampToValueAtTime(780, at + dur)
  amp.gain.setValueAtTime(0.0001, at)
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(filter)
  shimmer.connect(filter)
  filter.connect(amp)
  amp.connect(out)
  osc.start(at)
  shimmer.start(at)
  osc.stop(at + dur + 0.03)
  shimmer.stop(at + dur + 0.03)
}

function bedThump(at: number, gain: number) {
  const a = audio()
  const out = bedDestination()
  if (!a || !out) return
  const osc = a.createOscillator()
  const amp = a.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(92, at)
  osc.frequency.exponentialRampToValueAtTime(48, at + 0.14)
  amp.gain.setValueAtTime(0.0001, at)
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.006)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.16)
  osc.connect(amp)
  amp.connect(out)
  osc.start(at)
  osc.stop(at + 0.18)
}

function bedShaker(at: number, gain: number) {
  const a = audio()
  const out = bedDestination()
  if (!a || !out) return
  const buffer = a.createBuffer(1, Math.max(1, Math.floor(a.sampleRate * 0.055)), a.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  const filter = a.createBiquadFilter()
  const amp = a.createGain()
  src.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.value = 3_200
  filter.Q.value = 0.8
  amp.gain.setValueAtTime(gain, at)
  amp.gain.exponentialRampToValueAtTime(0.0001, at + 0.06)
  src.connect(filter)
  filter.connect(amp)
  amp.connect(out)
  src.start(at)
}

const MUSIC_BARS = [
  { bass: 146.83, notes: [293.66, 349.23, 440, 349.23, 293.66, 440] }, // Dm add9
  { bass: 174.61, notes: [349.23, 440, 523.25, 440, 349.23, 523.25] }, // F maj7
  { bass: 130.81, notes: [261.63, 329.63, 392, 329.63, 261.63, 392] }, // C add9
  { bass: 196, notes: [392, 493.88, 587.33, 493.88, 392, 587.33] }, // G sus2
] as const

function scheduleBed() {
  const a = audio()
  if (!a || !bedGain || !bedActive) return
  const eighth = 60 / 216
  const bar = eighth * 6
  while (nextBarAt < a.currentTime + 0.75) {
    const chord = MUSIC_BARS[barIndex % MUSIC_BARS.length]!
    for (let step = 0; step < 6; step++) {
      const at = nextBarAt + step * eighth
      bedShaker(at, step === 0 || step === 3 ? 0.014 : 0.009)
      if (step === 0 || step === 3) bedThump(at, step === 0 ? 0.052 : 0.036)
      bedPluck(chord.notes[step]!, at + 0.008, step === 0 || step === 3 ? 0.19 : 0.13, step === 0 || step === 3 ? 0.07 : 0.045)
    }
    bedPluck(chord.bass, nextBarAt, 0.42, 0.05)
    bedPluck(chord.bass * 1.5, nextBarAt + eighth * 3, 0.28, 0.032)
    nextBarAt += bar
    barIndex++
  }
  musicTimer = window.setTimeout(scheduleBed, 230)
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
  bedGain.gain.value = muted() ? 0.0001 : 0.09
  bedFilter = a.createBiquadFilter()
  bedFilter.type = 'lowpass'
  bedFilter.frequency.value = 4_400
  const delay = a.createDelay(0.3)
  const feedback = a.createGain()
  delay.delayTime.value = 0.15
  feedback.gain.value = 0.12
  bedGain.connect(bedFilter)
  bedFilter.connect(out)
  bedFilter.connect(delay)
  delay.connect(feedback)
  feedback.connect(delay)
  delay.connect(out)
  nextBarAt = a.currentTime + 0.06
  barIndex = 0
  bedActive = true
  if (musicTimer != null) window.clearTimeout(musicTimer)
  scheduleBed()
}

export function setHumoBedLevel(on: boolean) {
  const a = ctx
  if (!bedGain || !a) return
  const active = on && !muted()
  bedGain.gain.cancelScheduledValues(a.currentTime)
  bedGain.gain.setTargetAtTime(active ? 0.09 : 0.0001, a.currentTime, 0.06)
  if (active && !bedActive) {
    bedActive = true
    nextBarAt = a.currentTime + 0.05
    scheduleBed()
  }
  if (!active && bedActive) {
    bedActive = false
    if (musicTimer != null) window.clearTimeout(musicTimer)
    musicTimer = null
  }
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
  bed: 'loop original 6/8: cuerdas pulsadas, madera y percusión seca',
  license: 'composición procedural original Aura Arcade 2026',
} as const

/**
 * QR byte-mode ECC-M, versions 2–5. Suficiente para https://aura.ia.bo/pulso
 * y URLs locales cortas. Sin dependencias.
 */

const EXP = new Uint8Array(512)
const LOG = new Uint8Array(256)
;(() => {
  let x = 1
  for (let i = 0; i < 255; i++) {
    EXP[i] = x
    LOG[x] = i
    x *= 2
    if (x & 0x100) x ^= 0x11d
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]
})()

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return EXP[LOG[a] + LOG[b]]!
}

type Ver = {
  v: number
  size: number
  data: number
  ecc: number
  blocks: number
  align: number
}

const VERS: Ver[] = [
  { v: 2, size: 25, data: 28, ecc: 16, blocks: 1, align: 18 },
  { v: 3, size: 29, data: 44, ecc: 26, blocks: 1, align: 22 },
  { v: 4, size: 33, data: 64, ecc: 18, blocks: 2, align: 26 },
  { v: 5, size: 37, data: 86, ecc: 24, blocks: 2, align: 30 },
]

function rsGen(count: number): number[] {
  let poly = [1]
  for (let i = 0; i < count; i++) {
    const next = new Array(poly.length + 1).fill(0)
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], EXP[i]!)
      next[j + 1] ^= poly[j]!
    }
    poly = next
  }
  return poly
}

function rsEcc(data: number[], eccCount: number): number[] {
  const gen = rsGen(eccCount)
  const buf = data.concat(new Array(eccCount).fill(0))
  for (let i = 0; i < data.length; i++) {
    const coef = buf[i]!
    if (coef === 0) continue
    for (let j = 0; j < gen.length; j++) {
      buf[i + j] ^= gfMul(gen[j]!, coef)
    }
  }
  return buf.slice(data.length)
}

function pushBits(bits: number[], value: number, n: number): void {
  for (let i = n - 1; i >= 0; i--) bits.push((value >>> i) & 1)
}

function bytesToBits(bytes: number[]): number[] {
  const bits: number[] = []
  for (const b of bytes) pushBits(bits, b, 8)
  return bits
}

function pickVer(byteLen: number): Ver {
  for (const ver of VERS) {
    const capacity = ver.data - 2
    if (byteLen <= capacity) return ver
  }
  throw new Error('QR too long')
}

function fillFinders(mod: boolean[][], reserved: boolean[][], size: number): void {
  const place = (r0: number, c0: number) => {
    for (let r = -1; r < 8; r++) {
      for (let c = -1; c < 8; c++) {
        const rr = r0 + r
        const cc = c0 + c
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue
        const on =
          r >= 0 &&
          r <= 6 &&
          c >= 0 &&
          c <= 6 &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
        mod[rr]![cc] = on
        reserved[rr]![cc] = true
      }
    }
  }
  place(0, 0)
  place(0, size - 7)
  place(size - 7, 0)
}

function fillTiming(mod: boolean[][], reserved: boolean[][], size: number): void {
  for (let i = 8; i < size - 8; i++) {
    const on = i % 2 === 0
    mod[6]![i] = on
    mod[i]![6] = on
    reserved[6]![i] = true
    reserved[i]![6] = true
  }
}

function fillAlign(mod: boolean[][], reserved: boolean[][], size: number, pos: number): void {
  for (let r = pos - 2; r <= pos + 2; r++) {
    for (let c = pos - 2; c <= pos + 2; c++) {
      const on = r === pos - 2 || r === pos + 2 || c === pos - 2 || c === pos + 2 || (r === pos && c === pos)
      mod[r]![c] = on
      reserved[r]![c] = true
    }
  }
}

function bchFormat(eccAndMask: number): number {
  let d = eccAndMask << 10
  while (bitLen(d) - 11 >= 0) {
    d ^= 0b10100110111 << (bitLen(d) - 11)
  }
  return ((eccAndMask << 10) | d) ^ 0x5412
}

function bitLen(n: number): number {
  return n === 0 ? 0 : 32 - Math.clz32(n)
}

function maskBit(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0:
      return (r + c) % 2 === 0
    case 1:
      return r % 2 === 0
    case 2:
      return c % 3 === 0
    case 3:
      return (r + c) % 3 === 0
    case 4:
      return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0
    case 5:
      return ((r * c) % 2) + ((r * c) % 3) === 0
    case 6:
      return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0
    default:
      return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  }
}

function applyFormat(mod: boolean[][], reserved: boolean[][], size: number, mask: number): void {
  const bits = bchFormat((0b00 << 3) | mask)
  const set = (r: number, c: number, i: number) => {
    const on = ((bits >> i) & 1) === 1
    mod[r]![c] = on
    reserved[r]![c] = true
  }
  for (let i = 0; i < 6; i++) set(i, 8, i)
  set(7, 8, 6)
  set(8, 8, 7)
  set(8, 7, 8)
  for (let i = 9; i < 15; i++) set(8, 14 - i, i)

  for (let i = 0; i < 8; i++) set(8, size - 1 - i, i)
  for (let i = 8; i < 15; i++) set(size - 15 + i, 8, i)
  mod[size - 8]![8] = true
  reserved[size - 8]![8] = true
}

function penalty(mod: boolean[][], size: number): number {
  let score = 0
  for (let r = 0; r < size; r++) {
    let run = 1
    for (let c = 1; c < size; c++) {
      if (mod[r]![c] === mod[r]![c - 1]) run++
      else {
        if (run >= 5) score += run - 2
        run = 1
      }
    }
    if (run >= 5) score += run - 2
  }
  for (let c = 0; c < size; c++) {
    let run = 1
    for (let r = 1; r < size; r++) {
      if (mod[r]![c] === mod[r - 1]![c]) run++
      else {
        if (run >= 5) score += run - 2
        run = 1
      }
    }
    if (run >= 5) score += run - 2
  }
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = mod[r]![c]
      if (v === mod[r]![c + 1] && v === mod[r + 1]![c] && v === mod[r + 1]![c + 1]) score += 3
    }
  }
  return score
}

function placeData(mod: boolean[][], reserved: boolean[][], size: number, bits: number[], mask: number): void {
  let i = 0
  let up = true
  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) {
      const r = up ? size - 1 - vert : vert
      for (let k = 0; k < 2; k++) {
        const c = right - k
        if (reserved[r]![c]) continue
        const bit = i < bits.length ? bits[i]! : 0
        i += 1
        mod[r]![c] = (bit === 1) !== maskBit(mask, r, c)
      }
    }
    up = !up
  }
}

export function encodeQr(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text))
  const ver = pickVer(bytes.length)
  const bits: number[] = []
  pushBits(bits, 0b0100, 4)
  pushBits(bits, bytes.length, 8)
  for (const b of bytes) pushBits(bits, b, 8)
  const capacityBits = ver.data * 8
  const remain = capacityBits - bits.length
  pushBits(bits, 0, Math.min(4, Math.max(0, remain)))
  while (bits.length % 8 !== 0) bits.push(0)
  const pad = [0b11101100, 0b00010001]
  let pi = 0
  while (bits.length < capacityBits) {
    pushBits(bits, pad[pi % 2]!, 8)
    pi += 1
  }
  const dataBytes: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]!
    dataBytes.push(v)
  }

  const blockData = ver.data / ver.blocks
  const blocks: number[][] = []
  for (let b = 0; b < ver.blocks; b++) {
    const slice = dataBytes.slice(b * blockData, (b + 1) * blockData)
    blocks.push(slice.concat(rsEcc(slice, ver.ecc)))
  }

  const interleaved: number[] = []
  const maxLen = Math.max(...blocks.map((b) => b.length))
  for (let i = 0; i < maxLen; i++) {
    for (const block of blocks) {
      if (i < block.length) interleaved.push(block[i]!)
    }
  }
  const outBits = bytesToBits(interleaved)
  for (let i = 0; i < 7; i++) outBits.push(0)

  const size = ver.size
  const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  const base: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false))
  fillFinders(base, reserved, size)
  fillTiming(base, reserved, size)
  fillAlign(base, reserved, size, ver.align)
  for (let i = 0; i < 9; i++) {
    reserved[8]![i] = true
    reserved[i]![8] = true
    reserved[8]![size - 1 - i] = true
    reserved[size - 1 - i]![8] = true
  }
  reserved[size - 8]![8] = true

  let bestMask = 0
  let bestScore = Infinity
  let best: boolean[][] | null = null
  for (let mask = 0; mask < 8; mask++) {
    const mod = base.map((row) => row.slice())
    const res = reserved.map((row) => row.slice())
    placeData(mod, res, size, outBits, mask)
    applyFormat(mod, res, size, mask)
    const s = penalty(mod, size)
    if (s < bestScore) {
      bestScore = s
      bestMask = mask
      best = mod
    }
  }
  void bestMask
  return best!
}

export function qrSvg(text: string, px = 280, pad = 3): string {
  const mod = encodeQr(text)
  const n = mod.length
  const dim = n + pad * 2
  const cell = px / dim
  let rects = ''
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (mod[r]![c]) {
        rects += `<rect x="${(c + pad) * cell}" y="${(r + pad) * cell}" width="${cell}" height="${cell}"/>`
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" shape-rendering="crispEdges"><rect width="${px}" height="${px}" fill="#fff"/>${rects}</svg>`
}

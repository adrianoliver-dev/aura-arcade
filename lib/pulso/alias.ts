import { cambaAlias } from './camba'

/** Alias + tag post-juego. Máx 12 chars, filtro groserías. */

const MAX_ALIAS = 12
const TAG_LEN = 3

const BLOCKED = [
  'puta',
  'puto',
  'mierda',
  'verga',
  'pene',
  'culo',
  'caca',
  'porno',
  'sex',
  'nazi',
  'hitler',
  'pedo',
  'tetas',
  ' coño',
  'coño',
  'joder',
  'gilip',
  'marica',
  'maricon',
  'maricón',
  'boludo',
  'forro',
  'concha',
  'pija',
  'fuck',
  'shit',
  'ass',
  'dick',
  'cunt',
]

function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
}

export function sanitizeAlias(raw: string | undefined | null, seed = 'pulso'): string {
  const trimmed = (raw ?? '').replace(/\s+/g, ' ').trim()
  const clipped = trimmed.slice(0, MAX_ALIAS)
  const cleaned = clipped.replace(/[^\p{L}\p{N} ._-]/gu, '')
  if (!cleaned) return cambaAlias(seed)
  const folded = fold(cleaned).replace(/[\s._-]/g, '')
  if (BLOCKED.some((w) => folded.includes(w))) return cambaAlias(`${seed}:x`)
  return cleaned
}

export function sanitizeTag(raw: string | undefined | null): string {
  const t = (raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, TAG_LEN)
  if (t.length < 2) return 'SCZ'
  const folded = fold(t)
  if (BLOCKED.some((w) => folded.includes(w))) return 'SCZ'
  return t.padEnd(TAG_LEN, 'X')
}

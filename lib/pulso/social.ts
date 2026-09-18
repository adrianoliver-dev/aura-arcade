/** Redes del stand. No están en contact.ts de master; override por env. */

const ARCADE_URL = (process.env.NEXT_PUBLIC_ARCADE_URL?.trim() || 'http://127.0.0.1:3020').replace(/\/$/, '')

export const PULSO_PUBLIC_URL = ARCADE_URL
export const HUMO_PLAY_URL = `${ARCADE_URL}/jugar`

/** Payload del QR de stand: abre la partida, no la landing ni localhost inventado. */
export function arcadeQrTarget(base = PULSO_PUBLIC_URL): string {
  const origin = base.replace(/\/$/, '')
  return origin.endsWith('/jugar') ? origin : `${origin}/jugar`
}

export function arcadePlayHostLabel(target = arcadeQrTarget()): string {
  return target.replace(/^https?:\/\//, '')
}

export function humoChallengeUrl(shareSeed: string): string {
  return `${HUMO_PLAY_URL}?s=${encodeURIComponent(shareSeed)}`
}

export function humoChallengeWhatsAppHref(text: string): string {
  const params = new URLSearchParams()
  params.set('text', text)
  return `https://api.whatsapp.com/send?${params.toString()}`
}

export const PULSO_FACEBOOK_URL =
  process.env.NEXT_PUBLIC_AURA_FACEBOOK_URL?.trim() ||
  'https://www.facebook.com/profile.php?id=61591430458204'

export const PULSO_LINKEDIN_URL =
  process.env.NEXT_PUBLIC_AURA_LINKEDIN_URL?.trim() || 'https://www.linkedin.com/company/aurabo'

export const PULSO_INSTAGRAM_URL = process.env.NEXT_PUBLIC_AURA_INSTAGRAM_URL?.trim() || ''

export const PULSO_WHATSAPP_PRESET =
  'Hola, jugué AURA: ANTES DEL HUMO en Fexpocruz. Trabajo con campo, brigada o municipio y quiero ver cómo Aura baja el fuego a territorio.'

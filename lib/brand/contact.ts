/** Contacto comercial — override con NEXT_PUBLIC_AURA_CONTACT_EMAIL si hace falta. */

export const AURA_SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_AURA_CONTACT_EMAIL?.trim() || 'contacto@aura.ia.bo'

/** WhatsApp comercial / CEO (+591 77838140). Click-to-chat humano: planes, demo. */
export const AURA_WHATSAPP_DIGITS =
  process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.replace(/\D/g, '') || '59177838140'

export const AURA_WHATSAPP_DISPLAY = '+591 77838140'

/** WABA AURAbo (+591 77323776). El agente escribe alertas y OTP; no es el chat del CEO. */
export const AURA_AGENT_WHATSAPP_DIGITS =
  process.env.NEXT_PUBLIC_AURA_AGENT_WHATSAPP?.replace(/\D/g, '') || '59177323776'

export const AURA_AGENT_WHATSAPP_DISPLAY = '+591 77323776'

const DEFAULT_WA_PRESET =
  'Hola, quiero información sobre Aura, planes Community o Custom, y agendar una demo.'

export function getWhatsAppHref(preset?: string): string {
  const text = preset?.trim() || process.env.NEXT_PUBLIC_WHATSAPP_PRESET_TEXT?.trim() || DEFAULT_WA_PRESET
  const phone = AURA_WHATSAPP_DIGITS.replace(/\D/g, '')
  const params = new URLSearchParams()
  params.set('phone', phone)
  if (text) params.set('text', text)
  // api.whatsapp.com/send abre el chat; wa.me mal formado muestra PIN/emparejado.
  return `https://api.whatsapp.com/send?${params.toString()}`
}

export function getSalesMailtoHref(subject?: string): string {
  const subj = subject?.trim() || 'Consulta sobre planes Aura'
  return `mailto:${AURA_SUPPORT_EMAIL}?subject=${encodeURIComponent(subj)}`
}

export type CustomQuoteContactContext = {
  fullName?: string
  email?: string
  phone?: string
  role?: string
  farmName?: string
  farmSize?: string
  hectares?: string
}

/** Mensaje prellenado para cotización Custom (hectáreas y alcance). */
export function getCustomPlanQuoteWhatsAppHref(ctx: CustomQuoteContactContext): string {
  const lines = [
    'Hola, solicito cotización del plan Custom de Aura.',
    ctx.fullName ? `Nombre: ${ctx.fullName}` : null,
    ctx.email ? `Correo: ${ctx.email}` : null,
    ctx.phone ? `Teléfono: ${ctx.phone}` : null,
    ctx.role ? `Rol: ${ctx.role}` : null,
    ctx.farmName ? `Operación / finca: ${ctx.farmName}` : null,
    ctx.farmSize || ctx.hectares ? `Hectáreas aprox.: ${ctx.farmSize ?? ctx.hectares}` : null,
    'Entiendo que empiezo con Community gratis hasta activar Custom.',
  ].filter(Boolean)
  return getWhatsAppHref(lines.join('\n'))
}

export function getCustomPlanQuoteMailtoHref(ctx: CustomQuoteContactContext): string {
  const body = [
    'Solicito cotización del plan Custom de Aura.',
    '',
    ctx.fullName ? `Nombre: ${ctx.fullName}` : '',
    ctx.email ? `Correo: ${ctx.email}` : '',
    ctx.phone ? `Teléfono: ${ctx.phone}` : '',
    ctx.role ? `Rol: ${ctx.role}` : '',
    ctx.farmName ? `Operación: ${ctx.farmName}` : '',
    ctx.farmSize || ctx.hectares ? `Hectáreas aprox.: ${ctx.farmSize ?? ctx.hectares}` : '',
  ]
    .filter(Boolean)
    .join('\n')
  const subject = 'Cotización plan Custom — Aura'
  return `mailto:${AURA_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

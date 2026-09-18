/** Posición de la señal ¡AHORA! para que sobreviva 16:9 y 9:16. */

export function pulsoNowLabelY(width: number, height: number): number {
  const w = Math.max(1, width)
  const h = Math.max(1, height)
  const size = Math.min(w, h)
  const oy = (h - size) / 2
  const cy = oy + 0.5 * size
  const desired = cy - size * 0.38
  const min = Math.max(36, h * 0.08)
  const max = Math.min(h * 0.24, h - 48)
  return Math.min(max, Math.max(min, desired))
}

export function pulsoNowLabelFits(width: number, height: number): boolean {
  const y = pulsoNowLabelY(width, height)
  return y >= 24 && y <= height - 24
}

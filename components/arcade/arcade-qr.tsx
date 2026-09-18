import { qrSvg } from '@/lib/pulso/qr'
import { PULSO_PUBLIC_URL } from '@/lib/pulso/social'

type Props = {
  alt?: string
  className?: string
  size?: number
}

/**
 * El QR se calcula con la URL pública que se inyecta al construir el sitio.
 * Así no puede sobrevivir un PNG de localhost, GitHub o un dominio anterior.
 */
export function ArcadeQr({ alt = 'QR para jugar AURA ARCADE', className, size = 280 }: Props) {
  const svg = qrSvg(PULSO_PUBLIC_URL, size)
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

  return <img src={src} alt={alt} width={size} height={size} className={className} />
}

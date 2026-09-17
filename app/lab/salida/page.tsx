import { SalidaGame } from '@/components/salida/salida-game'

export default async function LabSalidaPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return <SalidaGame demo={sp.demo === '1'} />
}

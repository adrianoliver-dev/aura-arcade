import { MuroGame } from '@/components/muro/muro-game'

export default async function LabMuroPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return <MuroGame demo={sp.demo === '1'} />
}

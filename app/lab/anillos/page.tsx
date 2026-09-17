import { PulsoGame } from '@/components/pulso/pulso-game'

export default async function LabAnillosPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return <PulsoGame demo={sp.demo === '1'} />
}

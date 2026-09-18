import { RadioGameV2 } from '@/components/radio/radio-game-v2'

export default async function LabRadioPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return <RadioGameV2 demo={sp.demo === '1'} />
}

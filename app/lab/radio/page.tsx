import { RadioGame } from '@/components/radio/radio-game'

export default async function LabRadioPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>
}) {
  const sp = await searchParams
  return <RadioGame demo={sp.demo === '1'} />
}

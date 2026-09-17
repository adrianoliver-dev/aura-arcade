'use client'

type Props = {
  kicker: string
  title: string
  body: string
  cue: string
  accent: string
  mission?: string
  toBeat?: number
  onStart?: () => void
  interactive?: boolean
}

export function ArcadeReady({
  kicker,
  title,
  body,
  cue,
  accent,
  mission,
  toBeat,
  onStart,
  interactive = true,
}: Props) {
  const inner = (
    <>
      <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.36em]" style={{ color: accent }}>
        {kicker}
      </p>
      <p className="mt-3 text-3xl font-black leading-tight tracking-tight">{title}</p>
      <p className="mx-auto mt-3 max-w-xs text-sm text-white/70">{body}</p>
      {mission ? (
        <p className="mx-auto mt-4 max-w-xs rounded-full border px-3 py-1.5 text-[11px]" style={{ borderColor: `${accent}66`, color: accent }}>
          {mission}
        </p>
      ) : null}
      {toBeat && toBeat > 0 ? <p className="mt-2 text-[11px] text-white/45">A vencer {toBeat}</p> : null}
      <p className="mt-8 animate-pulse font-[family-name:var(--hud-font)] text-xs tracking-[0.28em] text-[#F2A021]">{cue}</p>
    </>
  )

  if (!interactive || !onStart) {
    return <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">{inner}</div>
  }

  return (
    <button
      type="button"
      aria-label={`${title}. ${cue}`}
      className="absolute inset-0 z-10 flex min-h-[44px] flex-col items-center justify-center px-6 text-center"
      onClick={onStart}
    >
      {inner}
    </button>
  )
}

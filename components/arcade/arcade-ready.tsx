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
      <div
        className="mb-6 h-20 w-20 rounded-full border-2"
        style={{ borderColor: accent, boxShadow: `0 0 40px ${accent}55` }}
      />
      <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.36em]" style={{ color: accent }}>
        {kicker}
      </p>
      <p className="mt-3 text-3xl font-black leading-tight tracking-tight">{title}</p>
      <p className="mx-auto mt-3 max-w-xs text-base leading-snug text-white/75">{body}</p>
      {mission ? (
        <p
          className="mx-auto mt-4 max-w-xs rounded-full border px-3 py-1.5 text-[11px]"
          style={{ borderColor: `${accent}66`, color: accent }}
        >
          {mission}
        </p>
      ) : null}
      {toBeat && toBeat > 0 ? <p className="mt-2 text-[11px] text-white/45">A vencer {toBeat}</p> : null}
      <p className="mt-8 min-h-11 font-[family-name:var(--hud-font)] text-sm tracking-[0.28em] text-[#F2A021]">{cue}</p>
    </>
  )

  if (!interactive || !onStart) {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B10]/55 px-6 text-center">
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-label={`${title}. ${cue}`}
      className="absolute inset-0 z-10 flex min-h-11 flex-col items-center justify-center bg-[#0B0B10]/55 px-6 text-center"
      onClick={onStart}
    >
      {inner}
    </button>
  )
}

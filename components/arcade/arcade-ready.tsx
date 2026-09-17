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
        className="aura-ready-ring mb-5 h-[4.5rem] w-[4.5rem] rounded-full border-2"
        style={{ borderColor: accent, boxShadow: `0 0 36px ${accent}66` }}
      />
      <p className="font-[family-name:var(--hud-font)] text-[11px] tracking-[0.36em]" style={{ color: accent }}>
        {kicker}
      </p>
      <p className="mt-3 max-w-sm text-4xl font-black leading-[0.95] tracking-tight">{title}</p>
      <p className="mx-auto mt-3 max-w-xs text-base leading-snug text-white/80">{body}</p>
      {mission ? (
        <p
          className="mx-auto mt-4 max-w-xs rounded-full border px-3 py-1.5 text-[11px]"
          style={{ borderColor: `${accent}66`, color: accent }}
        >
          {mission}
        </p>
      ) : null}
      {toBeat && toBeat > 0 ? <p className="mt-2 text-[11px] text-white/45">A vencer {toBeat}</p> : null}
      <span
        className="mt-8 inline-flex min-h-12 min-w-[12rem] items-center justify-center rounded-2xl px-6 text-sm font-black tracking-[0.22em] text-[#0B0B10]"
        style={{ background: accent, boxShadow: `0 10px 32px ${accent}55` }}
      >
        {cue}
      </span>
    </>
  )

  if (!interactive || !onStart) {
    return (
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B10]/62 px-6 text-center backdrop-blur-[2px]">
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-label={`${title}. ${cue}`}
      className="absolute inset-0 z-10 flex min-h-11 flex-col items-center justify-center bg-[#0B0B10]/62 px-6 text-center backdrop-blur-[2px]"
      onClick={onStart}
    >
      {inner}
    </button>
  )
}

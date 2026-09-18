export function SalaAtmosphere() {
  return (
    <>
      <div
        aria-hidden
        className="sala-photo pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/art/sala-aura-chiquitania-v1.png')" }}
      />
      <div aria-hidden className="sala-lantern pointer-events-none absolute -left-28 top-[15%] h-72 w-72 rounded-full bg-[#19C37D]/18 blur-3xl" />
      <div aria-hidden className="sala-lantern sala-lantern-alt pointer-events-none absolute -right-20 top-[6%] h-64 w-64 rounded-full bg-[#F2A021]/14 blur-3xl" />
      <div aria-hidden className="sala-lines pointer-events-none absolute inset-x-0 top-[18%] h-px" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,13,.18),rgba(7,17,13,.4)_38%,rgba(7,17,13,.96)_90%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_24%,transparent_0,rgba(7,17,13,.02)_38%,rgba(7,17,13,.46)_100%)]" />
    </>
  )
}

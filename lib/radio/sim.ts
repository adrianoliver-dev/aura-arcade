/** RADIO ROJA — siete decisiones de prioridad, deterministas y auditables. */

export type Action = 'agua' | 'corte' | 'evacua'

/** La ronda nunca debe pasar de un minuto, aun cuando se dejan vencer señales. */
export const MATCH_MS = 46_000
export const ROUND_CALLS = 7
export const HOUSES = 3
/** Compatibilidad temporal con la pantalla anterior; ya no participa del score. */
export const AMMO_START: Record<Action, number> = { agua: 0, corte: 0, evacua: 0 }

export type Call = {
  id: number
  /** Identificador estable: no puede repetirse dentro de una ronda. */
  scenarioId: string
  appearMs: number
  commitMs: number
  correct: Action
  stake: number
  /** El mensaje que se escucha/lee. No nombra la orden correcta. */
  prompt: string
  /** Dos rastros breves para la escena, nunca una pista-respuesta. */
  clue: string
}

export type Decision = {
  id: number
  action: Action
  t: number
}

export type RadioResult = {
  score: number
  comboMax: number
  saves: number
  misses: number
  housesLeft: number
  answered: number
}

type Scenario = Pick<Call, 'scenarioId' | 'correct' | 'stake' | 'prompt' | 'clue'>

/* Las transmisiones describen prioridades, no la respuesta. Doce por familia
 * evitan que dos rondas cercanas se sientan calcadas. */
const SCENARIOS: Scenario[] = [
  { scenarioId: 'a-bebedero', correct: 'agua', stake: 30, prompt: 'La brasa quedó junto al bebedero. El viento aflojó.', clue: 'foco bajo · borde húmedo' },
  { scenarioId: 'a-estanque', correct: 'agua', stake: 31, prompt: 'Chispa aislada en la orilla del estanque. No saltó el camino.', clue: 'orilla · sin salto' },
  { scenarioId: 'a-manguera', correct: 'agua', stake: 32, prompt: 'El humo sale de una pila chica. La manguera está a un giro.', clue: 'foco chico · acceso corto' },
  { scenarioId: 'a-pozo', correct: 'agua', stake: 33, prompt: 'Una brasa muerde el pasto junto al pozo; el aire cayó.', clue: 'aire calmo · borde vivo' },
  { scenarioId: 'a-canal', correct: 'agua', stake: 34, prompt: 'El frente se achicó contra el canal y todavía no cruza.', clue: 'frente corto · canal' },
  { scenarioId: 'a-pileta', correct: 'agua', stake: 35, prompt: 'Una llama baja rodea la pileta. El monte está lejos.', clue: 'foco bajo · monte lejos' },
  { scenarioId: 'a-bomba', correct: 'agua', stake: 36, prompt: 'La bomba queda al lado de un foco que no encontró rastrojo.', clue: 'recurso cerca · sin avance' },
  { scenarioId: 'a-acequia', correct: 'agua', stake: 37, prompt: 'La acequia frena una punta. La otra todavía cabe en una pasada.', clue: 'punta corta · acequia' },
  { scenarioId: 'a-corral', correct: 'agua', stake: 38, prompt: 'Una brasa toca el cerco vacío. El tanque está detrás.', clue: 'cerco vacío · tanque cerca' },
  { scenarioId: 'a-laguna', correct: 'agua', stake: 39, prompt: 'El humo se queda pegado a la laguna; no levantó copa.', clue: 'borde húmedo · sin copa' },
  { scenarioId: 'a-tajamar', correct: 'agua', stake: 40, prompt: 'El tajamar queda a pocos pasos y el foco sigue concentrado.', clue: 'foco concentrado · tajamar' },
  { scenarioId: 'a-lluvia', correct: 'agua', stake: 41, prompt: 'El suelo sigue oscuro por la lluvia. Una sola punta arde.', clue: 'suelo húmedo · una punta' },
  { scenarioId: 'c-rastrojo', correct: 'corte', stake: 30, prompt: 'El viento empuja por rastrojo alto hacia monte ralo. Un camino cruza el frente.', clue: 'viento firme · camino' },
  { scenarioId: 'c-potrero', correct: 'corte', stake: 31, prompt: 'El potrero abre una lengua larga y seca entre dos cercos.', clue: 'lengua larga · pasto seco' },
  { scenarioId: 'c-bajada', correct: 'corte', stake: 32, prompt: 'La loma descarga brasas hacia una faja de pasto sin usar.', clue: 'bajada · faja seca' },
  { scenarioId: 'c-viento-norte', correct: 'corte', stake: 33, prompt: 'El norte gira y el humo apunta a un monte bajo; hay una picada al oeste.', clue: 'giro de viento · picada' },
  { scenarioId: 'c-dos-puntas', correct: 'corte', stake: 34, prompt: 'Dos puntas se buscan por el mismo rastrojo. El frente todavía tiene un cuello.', clue: 'dos puntas · cuello' },
  { scenarioId: 'c-camino', correct: 'corte', stake: 35, prompt: 'Las brasas saltan una huella y van hacia un lote seco; la ruta queda libre.', clue: 'salto · ruta libre' },
  { scenarioId: 'c-palmares', correct: 'corte', stake: 36, prompt: 'El calor trepa por palmares bajos y el aire gana fuerza.', clue: 'combustible alto · aire sube' },
  { scenarioId: 'c-rastra', correct: 'corte', stake: 37, prompt: 'El frente corre paralelo a la rastra. Todavía hay ancho para abrir una franja.', clue: 'avance lateral · ancho útil' },
  { scenarioId: 'c-puente', correct: 'corte', stake: 38, prompt: 'Un sendero une dos manchas secas y las brasas ya lo probaron.', clue: 'conexión seca · salto' },
  { scenarioId: 'c-chaco', correct: 'corte', stake: 39, prompt: 'El humo sale del chaco y busca la siguiente línea de monte.', clue: 'frente largo · monte delante' },
  { scenarioId: 'c-cuneta', correct: 'corte', stake: 40, prompt: 'La cuneta seca hace de mecha hacia una curva abierta.', clue: 'mecha seca · curva' },
  { scenarioId: 'c-grama', correct: 'corte', stake: 41, prompt: 'El viento raspa la grama y abre un corredor directo al sur.', clue: 'corredor · viento firme' },
  { scenarioId: 'e-curva', correct: 'evacua', stake: 30, prompt: 'Un grupo espera en la curva y el único paso se está estrechando.', clue: 'grupo cerca · salida angosta' },
  { scenarioId: 'e-corral', correct: 'evacua', stake: 31, prompt: 'El humo baja sobre un corral ocupado. La tranquera todavía está libre.', clue: 'corral ocupado · salida libre' },
  { scenarioId: 'e-casa', correct: 'evacua', stake: 32, prompt: 'Hay luces en una casa y las brasas vienen por la cuneta.', clue: 'casa activa · cuneta' },
  { scenarioId: 'e-escuela', correct: 'evacua', stake: 33, prompt: 'Un minibús quedó detenido mientras el viento cambia hacia la escuela.', clue: 'gente quieta · viento gira' },
  { scenarioId: 'e-puente', correct: 'evacua', stake: 34, prompt: 'Familias cruzan despacio y el puente es la única salida segura.', clue: 'familias · paso único' },
  { scenarioId: 'e-galpon', correct: 'evacua', stake: 35, prompt: 'Hay peones dentro del galpón; la nube ya borra la entrada.', clue: 'personas dentro · visibilidad baja' },
  { scenarioId: 'e-loma', correct: 'evacua', stake: 36, prompt: 'Una familia mira desde la loma. Abajo el humo ya les corta el regreso.', clue: 'familia · regreso corta' },
  { scenarioId: 'e-camioneta', correct: 'evacua', stake: 37, prompt: 'Dos camionetas esperan con niños; el desvío sigue abierto por pocos segundos.', clue: 'niños · desvío abierto' },
  { scenarioId: 'e-manga', correct: 'evacua', stake: 38, prompt: 'El ganado está en la manga y el calor toma el pasillo de salida.', clue: 'animales · pasillo' },
  { scenarioId: 'e-cabana', correct: 'evacua', stake: 39, prompt: 'Hay movimiento en la cabaña. La ruta segura queda del otro lado.', clue: 'cabaña activa · ruta opuesta' },
  { scenarioId: 'e-feria', correct: 'evacua', stake: 40, prompt: 'Una fila se junta en la tranquera mientras el humo baja al camino.', clue: 'fila · camino toma humo' },
  { scenarioId: 'e-puesto', correct: 'evacua', stake: 41, prompt: 'El puesto quedó habitado y la señal marca un solo desvío limpio.', clue: 'puesto activo · un desvío' },
]

function mulberryStep(rng: number): { rng: number; value: number } {
  const a = (rng + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return { rng: a, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

function shuffled<T>(source: readonly T[], rand: () => number): T[] {
  const out = [...source]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

function actionDeck(rand: () => number): Action[] {
  const source: Action[] = ['agua', 'agua', 'corte', 'corte', 'evacua', 'evacua', 'evacua']
  for (let tries = 0; tries < 12; tries += 1) {
    const deck = shuffled(source, rand)
    const hasTriple = deck.some((item, index) => index >= 2 && item === deck[index - 1] && item === deck[index - 2])
    if (!hasTriple) return deck
  }
  return ['agua', 'evacua', 'corte', 'evacua', 'agua', 'corte', 'evacua']
}

export function buildCalls(seed: number): Call[] {
  let rng = seed | 0
  const rand = () => {
    const step = mulberryStep(rng)
    rng = step.rng
    return step.value
  }
  const unusedByAction: Record<Action, Scenario[]> = {
    agua: shuffled(SCENARIOS.filter((row) => row.correct === 'agua'), rand),
    corte: shuffled(SCENARIOS.filter((row) => row.correct === 'corte'), rand),
    evacua: shuffled(SCENARIOS.filter((row) => row.correct === 'evacua'), rand),
  }
  const windows = [6_000, 5_800, 5_600, 5_400, 5_200, 5_000, 4_800]
  let at = 650
  return actionDeck(rand).map((action, id) => {
    const row = unusedByAction[action].pop()!
    const appearMs = at
    const commitMs = appearMs + windows[id]!
    at = commitMs + 420
    return { id, scenarioId: row.scenarioId, appearMs, commitMs, correct: row.correct, stake: row.stake, prompt: row.prompt, clue: row.clue }
  })
}

export function liveCall(t: number, calls: Call[], done: Set<number>): Call | null {
  return calls.find((call) => t >= call.appearMs && t < call.commitMs && !done.has(call.id)) ?? null
}

/** @deprecated RADIO v2 no utiliza munición; se conserva mientras Cursor tiene v1 sin commitear. */
export function emptyAmmo(): Record<Action, number> {
  return { ...AMMO_START }
}

export function simulateRun(seed: number, decisions: Decision[]): RadioResult {
  const calls = buildCalls(seed)
  const byId = new Map(decisions.map((decision) => [decision.id, decision]))
  let score = 0
  let combo = 0
  let comboMax = 0
  let saves = 0
  let misses = 0
  let answered = 0
  for (const call of calls) {
    const decision = byId.get(call.id)
    const valid = decision && decision.t >= call.appearMs && decision.t <= call.commitMs
    if (!valid || decision.action !== call.correct) {
      misses += 1
      combo = 0
      continue
    }
    answered += 1
    saves += 1
    combo += 1
    comboMax = Math.max(comboMax, combo)
    const span = Math.max(1, call.commitMs - call.appearMs)
    const reaction = (decision.t - call.appearMs) / span
    const speedBonus = reaction <= 0.34 ? 12 : reaction <= 0.64 ? 6 : 0
    const chainBonus = Math.min(combo - 1, 4) * 4
    score += call.stake + speedBonus + chainBonus
  }
  return { score, comboMax, saves, misses, housesLeft: Math.max(0, HOUSES - misses), answered }
}

export function parseDecisions(raw: unknown): Decision[] | null {
  if (!Array.isArray(raw) || raw.length > ROUND_CALLS) return null
  const out: Decision[] = []
  const seen = new Set<number>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const rec = item as Record<string, unknown>
    const id = Number(rec.id)
    const t = Number(rec.t)
    const action = rec.action
    if (!Number.isInteger(id) || id < 0 || id >= ROUND_CALLS) return null
    if (!Number.isFinite(t)) return null
    if (action !== 'agua' && action !== 'corte' && action !== 'evacua') return null
    if (seen.has(id)) return null // un solo commit por transmisión: no existe spam válido.
    seen.add(id)
    out.push({ id, action, t: Math.max(0, Math.min(MATCH_MS, t)) })
  }
  return out
}

export function radioTitle(score: number, saves: number, housesLeft: number): { title: string } {
  if (saves === ROUND_CALLS && score >= 320) return { title: 'Central impecable' }
  if (saves >= 6 && housesLeft === HOUSES) return { title: 'Jefe de guardia' }
  if (saves >= 5) return { title: 'Oído fino' }
  if (saves >= 3) return { title: 'Lectura rápida' }
  if (score > 0) return { title: 'Tomó la radio' }
  return { title: 'La señal se perdió' }
}

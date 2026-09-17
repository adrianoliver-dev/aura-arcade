/** Apodos y títulos de Fexpocruz — español camba, nunca “Visitante”. */

export const CAMBA_ALIAS = [
  'Yacare',
  'Patuju',
  'Motacu',
  'Jochi',
  'Soata',
  'Palometa',
  'Surubi',
  'Tatarenda',
  'BrasaLoca',
  'CambaFirme',
  'PeniVerde',
  'Toborochi',
  'Urubo',
  'Guapuru',
  'Tajibo',
  'Cutuchi',
  'Pirai',
  'Nembi',
  'Samaipa',
  'Cupesi',
  'Ibare',
  'Churrasca',
  'Kaalya',
  'Sotillo',
  'Barbecho',
  'ChacoSur',
  'FocoRojo',
  'PulsoSCZ',
  'Oriente',
  'Guayacan',
  'Cotoca',
  'Warnes',
  'Montero',
  'Porongo',
  'Paurito',
  'Trompillo',
  'Plan3000',
  'Mutualista',
  'LaGuardia',
  'ElBajio',
  'PiraiSur',
  'Equipetrol',
  'Palmasola',
  'Villa1ro',
  'SateliteN',
  'Ayacucho',
  'LosLotes',
  'CambaCua',
  'Capibara',
  'Taitetu',
  'Aguara',
  'Ocelote',
  'Tucan',
  'Paraba',
  'Sabalo',
  'Pacu',
  'Dorado',
  'Sicuri',
  'Peta',
  'Peji',
  'Caracu',
  'Totai',
  'Asai',
  'Copoazu',
  'Ambaibo',
  'Cedro',
  'Cuchi',
  'Soto',
  'Quebracho',
  'Algarrobo',
  'Pacay',
  'Guapomo',
  'Obo',
  'RioGrande',
  'KaaIya',
  'Izozog',
  'Tucavaca',
  'Otuquis',
  'Amboro',
  'Sehuencas',
  'ElTorno',
  'Mairana',
  'Comarapa',
  'Saipina',
  'Robore',
  'SanJose',
  'Camiri',
  'Charagua',
  'Pailon',
  'Mineros',
  'Yapacani',
  'SanJulian',
  'ElPuente',
  'Abapo',
  'Cabezas',
  'Boyuibe',
  'Cuevo',
  'Huacaya',
  'Machareti',
  'SanRamon',
  'SanMiguel',
  'Guarayos',
  'Okinawa',
  'Chane',
  'LomaAlta',
  'DonLorenzo',
  'Campanero',
  'Terebinto',
  'LasLomas',
  'ElArenal',
  'Hamacas',
  'LasPalmas',
  'ElCarmen',
  'ColpaBaja',
  'Canadas4',
  'Villa2do',
  'ElPrado',
  'ElFuerte',
  'LosChacos',
  'TajiboSur',
  'UruboN',
  'PetaLoma',
  'CambaNorte',
  'CambaEste',
  'CortaFuego',
  'AntesHumo',
  'OjoTigre',
  'BrasaSur',
  'MonteAlto',
  'PampaSur',
  'BosqueSCZ',
  'ChacoNorte',
  'CampoRojo',
  'VientoSur',
  'GuardiaN',
  'Brigada7',
  'FocoTres',
  'PredioSur',
  'Peni',
  'Palomaria',
  'LagunaCa',
  'Tajibito',
  'YacareSur',
  'MotacuN',
  'JochiRojo',
  'SurubiAzul',
  'PatujuSol',
  'IbareNorte',
  'WarnesSur',
  'MonteroN',
  'CotocaEste',
  'PailonSur',
  'CamiriN',
  'RoboreSur',
  'CharaguaN',
  'MineroSur',
  'AbapoNorte',
  'CabezaSur',
  'PauritoN',
  'PorongoS',
  'UruboEste',
  'PiraiOeste',
  'ChacoEste',
  'BrasaNorte',
  'FuegoSur',
  'MonteSur',
  'PampaNorte',
  'LagunaSur',
  'BosqueN',
  'CampoSur',
  'VientoN',
  'GuardiaS',
  'Brigada3',
  'FocoUno',
  'FocoDos',
  'PredioN',
  'HaVerde',
  'RutaCamba',
  'NodoSur',
  'NodoNorte',
  'AguaClara',
  'MonteRojo',
  'ChacoFirme',
] as const

export const CAMBA_TAGS = [
  'SCZ',
  'CAM',
  'ORI',
  'CHA',
  'PAN',
  'GUA',
  'CRZ',
  'FEX',
  'YAC',
  'MOT',
  'SUR',
  'PIR',
  'URU',
  'TAJ',
  'COT',
  'WAR',
  'MON',
  'POR',
  'PAI',
  'ROB',
  'MIN',
] as const

export type MissionKind = 'clavados' | 'focos' | 'racha' | 'limpio'

export type DailyMission = {
  kind: MissionKind
  goal: number
  label: string
}

const MISSIONS: DailyMission[] = [
  { kind: 'clavados', goal: 6, label: 'Clavá 6 focos al pelo' },
  { kind: 'focos', goal: 12, label: 'Apagá 12 focos' },
  { kind: 'racha', goal: 8, label: 'Llevá la racha a 8' },
  { kind: 'limpio', goal: 1, label: 'Que no entre ni una brasa' },
]

function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function cambaAlias(seed: string): string {
  const i = hash(seed) % CAMBA_ALIAS.length
  return CAMBA_ALIAS[i]!
}

export function cambaTag(seed: string): string {
  const i = hash(`${seed}:tag`) % CAMBA_TAGS.length
  return CAMBA_TAGS[i]!
}

const USED_ALIAS_KEY = 'humo:used-aliases'
const CUSTOM_KEY = 'humo:alias-custom'

export function listUsedAliases(): string[] {
  try {
    const raw = localStorage.getItem(USED_ALIAS_KEY)
    const arr = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function markAliasUsed(alias: string): void {
  try {
    const used = listUsedAliases()
    if (used.some((row) => row.toLowerCase() === alias.toLowerCase())) return
    used.push(alias)
    localStorage.setItem(USED_ALIAS_KEY, JSON.stringify(used.slice(-220)))
  } catch {
    /* private mode */
  }
}

export function uniqueCambaAlias(seed: string, extraTaken: string[] = []): string {
  const taken = new Set([...listUsedAliases(), ...extraTaken].map((row) => row.toLowerCase()))
  const start = hash(seed) % CAMBA_ALIAS.length
  for (let k = 0; k < CAMBA_ALIAS.length; k++) {
    const name = CAMBA_ALIAS[(start + k) % CAMBA_ALIAS.length]!
    if (!taken.has(name.toLowerCase())) {
      markAliasUsed(name)
      return name
    }
  }
  const base = CAMBA_ALIAS[start]!.slice(0, 9)
  const made = `${base}${String((hash(`${seed}:n`) % 90) + 10)}`.slice(0, 12)
  markAliasUsed(made)
  return made
}

export function anotherAlias(prev: string, salt: string, extraTaken: string[] = []): string {
  return uniqueCambaAlias(`${prev}:${salt}:${Date.now()}`, [prev, ...extraTaken])
}

export type PulsoTitle = {
  title: string
  blurb: string
}

export function pulsoTitle(score: number, comboMax: number, kills: number): PulsoTitle {
  if (score >= 12000 || comboMax >= 16) {
    return {
      title: 'Leyenda del pabellón',
      blurb: 'Hoy el stand es tuyo. Mandá el recorte y que te busquen en el pizarrón.',
    }
  }
  if (score >= 8000 || comboMax >= 12) {
    return { title: 'Dueño del pulso', blurb: 'Hoy el chaco te respeta. Mandá el recorte y que te desafíen.' }
  }
  if (score >= 4000 || kills >= 18) {
    return { title: 'El que apaga la brasa', blurb: 'Apagaste focos de verdad. Eso se presume en el stand.' }
  }
  if (score >= 1500 || comboMax >= 6) {
    return { title: 'Guardián del predio', blurb: 'El pulso te agarró el ritmo. Una revancha y subís.' }
  }
  if (score >= 500 || kills >= 6) {
    return { title: 'Camba alerta', blurb: 'Ya no sos turista: viste el fuego venir.' }
  }
  return { title: 'Recién aterriza', blurb: 'Entraste al mapa. Tocá de nuevo y dejá de ser puntero.' }
}

export function pulsoStars(
  score: number,
  comboMax: number,
  kills: number,
  breaches: number,
): 1 | 2 | 3 {
  if ((score >= 4000 && comboMax >= 8) || (breaches === 0 && kills >= 14 && comboMax >= 6)) return 3
  if (score >= 1500 || comboMax >= 6 || kills >= 12) return 2
  return 1
}

export type HumoMissionKind = 'ha' | 'eficiencia' | 'tres'

export type HumoMission = {
  kind: HumoMissionKind
  goal: number
  label: string
}

const HUMO_MISSIONS: HumoMission[] = [
  { kind: 'ha', goal: 40, label: '40 ha' },
  { kind: 'eficiencia', goal: 70, label: '70% ruta' },
  { kind: 'tres', goal: 3, label: '3 focos' },
]

export function humoMission(now = Date.now()): HumoMission {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now))
  return HUMO_MISSIONS[hash(`h:${day}`) % HUMO_MISSIONS.length]!
}

export function humoMissionProgress(
  mission: HumoMission,
  stats: { hectares: number; efficiency: number; arrived: number },
): { current: number; done: boolean } {
  if (mission.kind === 'ha') {
    return { current: stats.hectares, done: stats.hectares >= mission.goal }
  }
  if (mission.kind === 'eficiencia') {
    return { current: stats.efficiency, done: stats.efficiency >= mission.goal }
  }
  return { current: stats.arrived, done: stats.arrived >= mission.goal }
}

export function humoTitle(hectares: number, efficiency: number, arrived = 0): PulsoTitle {
  if (hectares >= 100 && arrived === 3) {
    return { title: 'Leyenda viva', blurb: '' }
  }
  if (hectares >= 80 && arrived === 3) {
    return { title: 'Leyenda del pabellón', blurb: '' }
  }
  if (arrived === 3 && hectares >= 60) {
    return { title: 'Triple camba', blurb: '' }
  }
  if (hectares >= 70) {
    return { title: 'Tajibo de oro', blurb: '' }
  }
  if (hectares >= 55) {
    return { title: 'Dueño del predio', blurb: '' }
  }
  if (arrived === 3) {
    return { title: 'Capitán de brigada', blurb: '' }
  }
  if (hectares >= 45) {
    return { title: 'Cortafuego', blurb: '' }
  }
  if (hectares >= 35) {
    return { title: 'Guardián del chaco', blurb: '' }
  }
  if (efficiency >= 85 && hectares >= 20) {
    return { title: 'Ruta perfecta', blurb: '' }
  }
  if (hectares >= 25) {
    return { title: 'Ojo de tigre', blurb: '' }
  }
  if (arrived >= 2) {
    return { title: 'Camba alerta', blurb: '' }
  }
  if (hectares >= 12) {
    return { title: 'Aprendiz', blurb: '' }
  }
  if (hectares >= 1) {
    return { title: 'Vio el humo', blurb: '' }
  }
  return { title: 'Recién aterriza', blurb: '' }
}

export function humoStars(hectares: number, efficiency: number, arrived: number): 1 | 2 | 3 {
  if (hectares >= 70 && arrived === 3) return 3
  if (hectares >= 35 || arrived >= 2 || efficiency >= 80) return 2
  return 1
}

export function dailyMission(now = Date.now()): DailyMission {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(now))
  return MISSIONS[hash(`m:${day}`) % MISSIONS.length]!
}

export function missionProgress(
  mission: DailyMission,
  stats: { perfects: number; kills: number; comboMax: number; breaches: number },
): { current: number; done: boolean } {
  if (mission.kind === 'clavados') {
    return { current: stats.perfects, done: stats.perfects >= mission.goal }
  }
  if (mission.kind === 'focos') {
    return { current: stats.kills, done: stats.kills >= mission.goal }
  }
  if (mission.kind === 'racha') {
    return { current: stats.comboMax, done: stats.comboMax >= mission.goal }
  }
  const clean = stats.breaches === 0 && stats.kills >= 4
  return { current: clean ? 1 : 0, done: clean }
}

const ALIAS_KEY = 'pulso:alias'
const TAG_KEY = 'pulso:tag'
const PB_KEY = 'humo:pb'
const PLAYS_KEY = 'humo:plays'

export function loadIdentity(seed: string): { alias: string; tag: string } {
  try {
    if (localStorage.getItem(CUSTOM_KEY) === '1') {
      const alias = localStorage.getItem(ALIAS_KEY)?.trim()
      const tag = localStorage.getItem(TAG_KEY)?.trim()
      if (alias && alias.length <= 12) {
        return { alias, tag: tag && tag.length >= 2 ? tag : cambaTag(seed) }
      }
    }
  } catch {
    /* private mode */
  }
  const made = { alias: uniqueCambaAlias(seed), tag: cambaTag(seed) }
  try {
    localStorage.setItem(ALIAS_KEY, made.alias)
    localStorage.setItem(TAG_KEY, made.tag)
  } catch {
    /* private mode */
  }
  return made
}

export function saveIdentity(alias: string, tag: string, custom = true): void {
  try {
    localStorage.setItem(ALIAS_KEY, alias)
    localStorage.setItem(TAG_KEY, tag)
    if (custom) localStorage.setItem(CUSTOM_KEY, '1')
    markAliasUsed(alias)
  } catch {
    /* private mode */
  }
}

export function loadPersonalBest(): number {
  try {
    return Math.max(0, Number(localStorage.getItem(PB_KEY) || 0) || 0)
  } catch {
    return 0
  }
}

export function savePersonalBest(score: number): number {
  const prev = loadPersonalBest()
  const next = Math.max(prev, score)
  try {
    localStorage.setItem(PB_KEY, String(next))
    const plays = Number(localStorage.getItem(PLAYS_KEY) || 0) + 1
    localStorage.setItem(PLAYS_KEY, String(plays))
  } catch {
    /* private mode */
  }
  return next
}

export function loadPlays(): number {
  try {
    return Math.max(0, Number(localStorage.getItem(PLAYS_KEY) || 0) || 0)
  } catch {
    return 0
  }
}

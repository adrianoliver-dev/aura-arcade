export type BoardEntry = {
  id: string
  alias: string
  tag: string
  score: number
  comboMax: number
  at: number
  /** Desempate. Si falta, el board usa `score`. HUMO guarda rankScore; los otros copian pts. */
  rankScore?: number
}

export type InterestPing = {
  at: number
  source: string
}

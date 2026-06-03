import { Tone } from './types'

export type QId = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'q9' | 'q10' | 'q11' | 'q12'
export type KAlgoRound = 1 | 2 | 3 | 4 | 5
export type KSpreadSelectionMode = 'within' | 'across'

export const K_QUADS: Record<QId, readonly number[]> = {
  q1: [1, 2, 5, 4],
  q2: [2, 3, 6, 5],
  q3: [7, 8, 11, 10],
  q4: [8, 9, 12, 11],
  q5: [13, 14, 17, 16],
  q6: [14, 15, 18, 17],
  q7: [19, 20, 23, 22],
  q8: [20, 21, 24, 23],
  q9: [25, 26, 29, 28],
  q10: [26, 27, 30, 29],
  q11: [31, 32, 35, 34],
  q12: [32, 33, 36, 35]
} as const

export const ROULETTE_BOARD_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
]

export const TABLE_NODE_KEYS = ['controls', 'virtualBoard', 'spin', 'result', 'bet', 'placed'] as const

export const TONE_CLASSES: Record<Tone, string> = {
  good: 'border-emerald-500/35 bg-emerald-500/5 text-emerald-700 dark:text-emerald-200',
  bad: 'border-rose-500/35 bg-rose-500/5 text-rose-700 dark:text-rose-200',
  warn: 'border-amber-500/35 bg-amber-500/5 text-amber-700 dark:text-amber-200',
  info: 'border-sky-500/35 bg-sky-500/5 text-sky-700 dark:text-sky-200',
  neutral: 'border-border bg-background text-foreground'
}

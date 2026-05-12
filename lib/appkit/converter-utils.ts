// const DEBOUNCE_NANO_BPS = Number(675)
// const DEBOUNCE_D = 10_000
export const withSecureRetry = (entry: number): number =>
  (entry * (10_000 + 675)) / 10_000

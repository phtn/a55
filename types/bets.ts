export interface BetResult {
  type: string
  schemaVersion: number
  emittedAt: string
  controls: {
    winVerb: string
    lastWinProfit: number
    signalFound: boolean
    isTracking: boolean
    auto: boolean
    scatter: boolean
    allowOverlaps: boolean
    spreadSelectionMode: string
    loaded: boolean
    betStatus: string
  }
  virtualBoard: {
    startingQuadrant: string
    baseUnit: number
    baseUnitInput: string
    inputMode: string
    selectedChip: number
    betMultiplier: number
    roundMultiplier: number
    totalStaked: number
    winAmount: number
    profit: number
    accWinnings: number
    accPct: number
    winStreak: number
    lockedBankValue: number
    spins: number
    trackedSpins: number
    hotNumbers: number[]
    tableState: string
    winningNumber: number
    nextBet: {
      round: number
      quadrant: string
      quadrants: string[]
      numbers: number[]
      quadrantNumbers: number[]
      unitStake: number
      zeroStake: number
      totalStake: number
      coverageCount: number
      coveragePercent: number
      allowOverlaps: boolean
      spreadQuadrants: string[]
      spreadSelectionMode: string
      scatter: boolean
      slots: {
        number: number
        bet: number
        placements: number
        unitStake: number
        isZeroHedge: boolean
        isQuadrantSlot: boolean
      }[]
    }
  }
  spin: {
    spinIndex: number
    winningNumber: number
    round: number
    hit: boolean
    hitType: string
    sessionOutcome: string
    nextRound: number
    nextQuadrant: string
    nextQuadrants: string[]
    candidateQuadrants: string[]
    selectedQuadrant: string
  }
  result: {
    stake: number
    sessionStake: number
    winAmount: number
    round: number
    profit: number
    profitPct: number
  }
  bet: {
    round: number
    quadrant: string
    quadrants: string[]
    numbers: number[]
    quadrantNumbers: number[]
    unitStake: number
    zeroStake: number
    totalStake: number
    coverageCount: number
    coveragePercent: number
    allowOverlaps: boolean
    spreadQuadrants: string[]
    spreadSelectionMode: string
    scatter: boolean
    slots: {
      number: number
      bet: number
      placements: number
      unitStake: number
      isZeroHedge: boolean
      isQuadrantSlot: boolean
    }[]
  }
  placed: {
    numbers: number[]
    cumulativeNumbers: number[]
    slots: {
      number: number
      bet: number
      placements: number
      unitStake: number
      isZeroHedge: boolean
      isQuadrantSlot: boolean
    }[]
  }
}

import { TABLE_NODE_KEYS } from '@/lib/roulette/constants'
import { TableNode, Tone } from '@/lib/roulette/types'
import { BetResult } from '@/types/bets'

export const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2
})

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0
})

export const formatNumber = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return numberFormatter.format(value)
}

export const formatInteger = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  return integerFormatter.format(value)
}

export const formatSignedNumber = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A'
  }

  const prefix = value > 0 ? '+' : ''

  return `${prefix}${numberFormatter.format(value)}`
}

export const formatStatus = (value: string | undefined) => {
  if (!value) {
    return 'N/A'
  }

  return value.replaceAll('_', ' ').replaceAll('-', ' ')
}

export const formatNumberList = (numbers: number[] | undefined, limit = 8) => {
  if (!numbers?.length) {
    return 'None'
  }

  const visible = numbers.slice(0, limit).join(', ')
  const remaining = numbers.length - limit

  return remaining > 0 ? `${visible} +${remaining}` : visible
}

export const getProfitTone = (value: number | undefined): Tone => {
  if (typeof value !== 'number') {
    return 'neutral'
  }

  if (value > 0) {
    return 'good'
  }

  if (value < 0) {
    return 'bad'
  }

  return 'neutral'
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const parseBetResult = (value: unknown): BetResult | null => {
  if (typeof value === 'string') {
    try {
      return parseBetResult(JSON.parse(value) as unknown)
    } catch {
      return null
    }
  }

  if (!isRecord(value) || !isRecord(value.controls)) {
    return null
  }

  return value as unknown as BetResult
}

export const getTableNodes = (value: unknown): TableNode[] => {
  const result = parseBetResult(value)

  if (!result) {
    return []
  }

  const nodes: TableNode[] = [
    {
      title: 'meta',
      data: {
        type: result.type,
        schemaVersion: result.schemaVersion,
        emittedAt: result.emittedAt
      }
    }
  ]

  for (const key of TABLE_NODE_KEYS) {
    const data = result[key]

    if (isRecord(data)) {
      nodes.push({ title: key, data })
    }
  }

  return nodes
}

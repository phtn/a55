import {
  executeYf2Request,
  YF2_OPERATIONS,
  Yf2InputError,
  Yf2NotFoundError,
  type Yf2ModuleOptions,
  type Yf2Operation,
  type Yf2Request
} from '@/lib/yf2'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const YF2_OPERATION_SET = new Set<Yf2Operation>(YF2_OPERATIONS)
const CONTROL_KEYS = new Set(['operation', 'module', 'symbol', 'symbols', 'query', 'options', 'moduleOptions'])
const ARRAY_OPTION_KEYS = new Set(['fields', 'modules'])
const BOOLEAN_OPTION_KEYS = new Set(['formatted', 'includePrePost', 'useYfid', 'merge', 'padTimeSeries'])
const NUMBER_OPTION_KEYS = new Set(['count', 'newsCount', 'quotesCount', 'reportsCount', 'start'])
const OPTION_ALIASES: Record<string, string> = {
  screenId: 'scrIds',
  statementModule: 'module'
}
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store'
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const parseBoolean = (value: string, key: string) => {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  throw new Yf2InputError(`\`${key}\` must be \`true\` or \`false\`.`)
}

const parseNumber = (value: string, key: string) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Yf2InputError(`\`${key}\` must be a valid number.`)
  }

  return parsed
}

const parseOperation = (value: string | null | undefined): Yf2Operation => {
  const operation = value?.trim() || 'quote'

  if (YF2_OPERATION_SET.has(operation as Yf2Operation)) {
    return operation as Yf2Operation
  }

  throw new Yf2InputError(`Unsupported operation \`${operation}\`. Supported operations: ${YF2_OPERATIONS.join(', ')}.`)
}

const parseOptionsJson = (value: string) => {
  try {
    const parsed = JSON.parse(value) as unknown

    if (!isRecord(parsed)) {
      throw new Yf2InputError('`options` must be a JSON object.')
    }

    return parsed
  } catch (error) {
    if (error instanceof Yf2InputError) {
      throw error
    }

    throw new Yf2InputError('`options` must be valid JSON.')
  }
}

const coerceOptionValue = (key: string, values: string[]) => {
  if (ARRAY_OPTION_KEYS.has(key)) {
    const items = values.flatMap(splitList)

    if (key === 'modules' && items.length === 1 && items[0] === 'all') {
      return 'all'
    }

    return items
  }

  const value = values[values.length - 1]?.trim() ?? ''

  if (BOOLEAN_OPTION_KEYS.has(key)) {
    return parseBoolean(value, key)
  }

  if (NUMBER_OPTION_KEYS.has(key)) {
    return parseNumber(value, key)
  }

  return value
}

const parseGetOptions = (searchParams: URLSearchParams) => {
  const baseOptions = searchParams.get('options')
  const options = baseOptions ? parseOptionsJson(baseOptions) : {}

  const uniqueKeys = new Set(Array.from(searchParams.keys()))

  for (const rawKey of uniqueKeys) {
    if (CONTROL_KEYS.has(rawKey)) {
      continue
    }

    const key = OPTION_ALIASES[rawKey] ?? rawKey
    options[key] = coerceOptionValue(key, searchParams.getAll(rawKey))
  }

  return Object.keys(options).length > 0 ? options : undefined
}

const readOptionalString = (value: unknown, field: string) => {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Yf2InputError(`\`${field}\` must be a string.`)
  }

  const normalized = value.trim()
  return normalized ? normalized : undefined
}

const readOptionalStringArray = (value: unknown, field: string) => {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value === 'string') {
    const values = splitList(value)
    return values.length > 0 ? values : undefined
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Yf2InputError(`\`${field}\` must be a string or string array.`)
  }

  const values = value.map((item) => item.trim()).filter(Boolean)
  return values.length > 0 ? values : undefined
}

const readOptionalModuleOptions = (value: unknown): Yf2ModuleOptions | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }

  if (!isRecord(value)) {
    throw new Yf2InputError('`moduleOptions` must be an object.')
  }

  const { validateResult } = value

  if (validateResult !== undefined && typeof validateResult !== 'boolean') {
    throw new Yf2InputError('`moduleOptions.validateResult` must be a boolean.')
  }

  if (validateResult === false) {
    return { validateResult: false }
  }

  if (validateResult === true) {
    return { validateResult: true }
  }

  return {}
}

const parsePostBody = (body: unknown): Yf2Request => {
  if (!isRecord(body)) {
    throw new Yf2InputError('Request body must be a JSON object.')
  }

  const rawOperation = readOptionalString(body.operation, 'operation') ?? readOptionalString(body.module, 'module')
  const options = body.options

  if (options !== undefined && !isRecord(options)) {
    throw new Yf2InputError('`options` must be an object.')
  }

  return {
    operation: parseOperation(rawOperation),
    symbol: readOptionalString(body.symbol, 'symbol'),
    symbols: readOptionalStringArray(body.symbols, 'symbols'),
    query: readOptionalString(body.query, 'query'),
    options,
    moduleOptions: readOptionalModuleOptions(body.moduleOptions)
  }
}

const parseGetRequest = (request: NextRequest): Yf2Request => {
  const searchParams = request.nextUrl.searchParams

  return {
    operation: parseOperation(searchParams.get('operation') ?? searchParams.get('module')),
    symbol: readOptionalString(searchParams.get('symbol'), 'symbol'),
    symbols: readOptionalStringArray(searchParams.get('symbols'), 'symbols'),
    query: readOptionalString(searchParams.get('query'), 'query'),
    options: parseGetOptions(searchParams)
  }
}

const createErrorResponse = (error: unknown) => {
  if (error instanceof Yf2InputError) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: NO_STORE_HEADERS })
  }

  if (error instanceof Yf2NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404, headers: NO_STORE_HEADERS })
  }

  const message = error instanceof Error ? error.message : 'Unknown upstream error.'
  const status = message.includes('No data found') ? 404 : 502

  console.error('[api/yf2]', error)

  return NextResponse.json({ error: message }, { status, headers: NO_STORE_HEADERS })
}

const handleRequest = async (resolveRequest: () => Promise<Yf2Request> | Yf2Request) => {
  try {
    const yfRequest = await resolveRequest()
    const data = await executeYf2Request(yfRequest)

    return NextResponse.json(
      {
        operation: yfRequest.operation,
        data
      },
      {
        headers: NO_STORE_HEADERS
      }
    )
  } catch (error) {
    return createErrorResponse(error)
  }
}

export const GET = async (request: NextRequest) => handleRequest(() => parseGetRequest(request))

export const POST = async (request: NextRequest) =>
  handleRequest(async () => {
    try {
      return parsePostBody(await request.json())
    } catch (error) {
      if (error instanceof Yf2InputError) {
        throw error
      }

      throw new Yf2InputError('Request body must be valid JSON.')
    }
  })

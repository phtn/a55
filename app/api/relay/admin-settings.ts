import { api } from '@/convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? null

const convex = convexUrl ? new ConvexHttpClient(convexUrl) : null

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const parseMaybeJson = (value: string): unknown => {
  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }

  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return trimmed
  }
}

const unwrapAdminSetting = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value
  }

  if (typeof value.error === 'string') {
    throw new Error(typeof value.message === 'string' ? value.message : 'Admin setting was not found')
  }

  const envelope =
    'identifier' in value && 'value' in value && value.value !== undefined ? value.value : value

  if (typeof envelope === 'string') {
    return parseMaybeJson(envelope)
  }

  if (!isRecord(envelope)) {
    return envelope
  }

  const data = asRecord(envelope.data)
  if (typeof data?.value === 'string') {
    return parseMaybeJson(data.value)
  }

  return envelope
}

export const asRecord = (value: unknown): Record<string, unknown> | null => (isRecord(value) ? value : null)

export const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined

export const asBoolean = (value: unknown): boolean | undefined => (typeof value === 'boolean' ? value : undefined)

export const getConfiguredAddress = (value: unknown): string | undefined => {
  const record = asRecord(value)

  return (
    asString(value) ??
    asString(record?.address) ??
    asString(record?.native) ??
    asString(record?.evmNative) ??
    asString(record?.btcNative) ??
    asString(record?.value)
  )
}

export const getAdminSettingPayload = async (identifier: string): Promise<unknown> => {
  if (!convex) {
    throw new Error('Convex URL is not configured')
  }

  const setting = await convex.query(api.admin.q.getAdminByIdentStrict, { identifier })
  const payload = unwrapAdminSetting(setting)

  if (payload === null || payload === undefined || payload === '') {
    throw new Error(`${identifier} is not configured`)
  }

  return payload
}

export const getAdminSettingRecord = async (identifier: string): Promise<Record<string, unknown>> => {
  const payload = await getAdminSettingPayload(identifier)
  const value = asRecord(payload)

  if (!value) {
    throw new Error(`${identifier} has invalid structure`)
  }

  return value
}

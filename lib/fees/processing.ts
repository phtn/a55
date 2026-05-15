type ProcessingFeePaymentMethod = 'cards' | 'crypto' | 'e_wallet'

type ResolveOrderPayableTotalCentsArgs = {
  paymentMethod?: string
  totalCents?: number
  processingFeeCents?: number
  totalWithCryptoFeeCents?: number
}

type ComputeProcessingFeeCentsArgs = {
  discountedSubtotalCents: number
  enabled: boolean
  paymentMethod: ProcessingFeePaymentMethod
  percent: number
  cashAppPercent?: number
  shippingCents?: number
}

type ComputeOrderSummarySubtotalCentsArgs = {
  itemsTotalCents: number
  redeemedStoreCreditCents?: number
  shippingCents?: number
}

type ComputeOrderSummaryProcessingFeeCentsArgs = ComputeOrderSummarySubtotalCentsArgs & {
  processingFeeCents?: number
  taxCents?: number
  totalCents?: number
}

type ComputeOrderTotalCentsArgs = {
  subtotalCents?: number
  taxCents?: number
  shippingCents?: number
  discountCents?: number
  totalCents?: number
}

type ComputeCryptoRelayTargetCentsArgs = {
  totalCents?: number
  processingFeeCents?: number
}

type ComputeCryptoFeeCentsArgs = {
  totalCents?: number
  totalWithCryptoFeeCents?: number
}

type ComputePersistedOrderPaymentAmountsArgs = {
  paymentMethod: ProcessingFeePaymentMethod
  discountedSubtotalCents: number
  totalCents: number
  taxCents?: number
  shippingCents?: number
  processingFeeEnabled?: boolean
  processingFeePercent?: number
  cashAppPercent?: number
  cryptoFeeEnabled?: boolean
  cryptoFeeAcc?: number
}

export const E_WALLET_PROCESSING_FEE_PERCENT = 5
export const CRYPTO_PAYMENT_DISCOUNT_PERCENT = 0

const normalizePercent = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined

export const formatProcessingFeePercent = (percent: number) => {
  const normalizedPercent = Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/\.?0+$/, '')

  return `${normalizedPercent}%`
}

export const getCashAppProcessingFeePercent = (paymentMethodsSetting: unknown) => {
  if (!paymentMethodsSetting || typeof paymentMethodsSetting !== 'object') {
    return undefined
  }

  const methods = (paymentMethodsSetting as { methods?: unknown }).methods
  if (!Array.isArray(methods)) {
    return undefined
  }

  const cashAppMethod = methods.find(
    (method): method is { id?: unknown; transactionFee?: unknown } =>
      !!method && typeof method === 'object' && (method as { id?: unknown }).id === 'e_wallet'
  )

  return normalizePercent(cashAppMethod?.transactionFee)
}

const normalizeMoneyCents = (value?: number) => (Number.isFinite(value) ? Math.max(0, value ?? 0) : 0)

export const isCryptoPaymentMethod = (paymentMethod?: string) =>
  paymentMethod === 'crypto_transfer' || paymentMethod === 'crypto_commerce'

export const computePaymentMethodDiscountCents = ({
  paymentMethod,
  subtotalCents,
  percent = CRYPTO_PAYMENT_DISCOUNT_PERCENT
}: {
  paymentMethod?: string
  subtotalCents: number
  percent?: number
}) => {
  if (!isCryptoPaymentMethod(paymentMethod)) {
    return 0
  }

  const normalizedPercent = normalizePercent(percent) ?? 0
  if (normalizedPercent === 0) {
    return 0
  }

  return Math.round(normalizeMoneyCents(subtotalCents) * (normalizedPercent / 100))
}

export const computeOrderSummarySubtotalCents = ({
  itemsTotalCents,
  redeemedStoreCreditCents = 0,
  shippingCents = 0
}: ComputeOrderSummarySubtotalCentsArgs) => {
  return Math.max(
    0,
    normalizeMoneyCents(itemsTotalCents) +
      normalizeMoneyCents(shippingCents) -
      normalizeMoneyCents(redeemedStoreCreditCents)
  )
}

export const computeOrderSummaryProcessingFeeCents = ({
  itemsTotalCents,
  redeemedStoreCreditCents = 0,
  processingFeeCents,
  shippingCents = 0,
  taxCents = 0,
  totalCents = 0
}: ComputeOrderSummaryProcessingFeeCentsArgs) => {
  const normalizedProcessingFeeCents = normalizeMoneyCents(processingFeeCents)
  if (normalizedProcessingFeeCents > 0) {
    return normalizedProcessingFeeCents
  }

  const subtotalCents = computeOrderSummarySubtotalCents({
    itemsTotalCents,
    redeemedStoreCreditCents,
    shippingCents
  })

  return Math.max(0, normalizeMoneyCents(totalCents) - subtotalCents - normalizeMoneyCents(taxCents))
}

export const computeOrderTotalCents = ({
  subtotalCents,
  taxCents,
  shippingCents,
  discountCents,
  totalCents
}: ComputeOrderTotalCentsArgs) => {
  const hasBreakdown =
    subtotalCents !== undefined || taxCents !== undefined || shippingCents !== undefined || discountCents !== undefined

  if (!hasBreakdown) {
    return normalizeMoneyCents(totalCents)
  }

  return Math.max(
    0,
    normalizeMoneyCents(subtotalCents) +
      normalizeMoneyCents(taxCents) +
      normalizeMoneyCents(shippingCents) -
      normalizeMoneyCents(discountCents)
  )
}

export const computeCryptoRelayTargetCents = ({ totalCents, processingFeeCents }: ComputeCryptoRelayTargetCentsArgs) =>
  Math.max(0, normalizeMoneyCents(totalCents) + normalizeMoneyCents(processingFeeCents))

export const computeCryptoFeeCents = ({ totalCents, totalWithCryptoFeeCents }: ComputeCryptoFeeCentsArgs) =>
  Math.max(0, normalizeMoneyCents(totalWithCryptoFeeCents) - normalizeMoneyCents(totalCents))

export const isProcessingFeePaymentMethod = (paymentMethod: ProcessingFeePaymentMethod) =>
  isCryptoPaymentMethod(paymentMethod) || paymentMethod === 'e_wallet'

export const computeProcessingFeeCents = ({
  discountedSubtotalCents,
  enabled,
  paymentMethod,
  percent,
  cashAppPercent,
  shippingCents = 0
}: ComputeProcessingFeeCentsArgs) => {
  if (!isProcessingFeePaymentMethod(paymentMethod)) {
    return 0
  }

  const normalizedSubtotalCents = Math.max(0, discountedSubtotalCents)
  const effectivePercent =
    paymentMethod === 'e_wallet' ? (normalizePercent(cashAppPercent) ?? E_WALLET_PROCESSING_FEE_PERCENT) : percent
  const normalizedPercent = Number.isFinite(effectivePercent) && effectivePercent > 0 ? effectivePercent / 100 : 0

  if ((paymentMethod !== 'e_wallet' && !enabled) || normalizedPercent === 0) {
    return 0
  }

  return Math.round((normalizedSubtotalCents + shippingCents) * normalizedPercent)
}

export const computePersistedOrderPaymentAmounts = ({
  paymentMethod,
  discountedSubtotalCents,
  totalCents,
  taxCents = 0,
  shippingCents = 0,
  processingFeeEnabled = false,
  processingFeePercent = 0,
  cashAppPercent,
  cryptoFeeEnabled = false,
  cryptoFeeAcc = 1
}: ComputePersistedOrderPaymentAmountsArgs) => {
  const processingFeeCents = computeProcessingFeeCents({
    discountedSubtotalCents,
    enabled: processingFeeEnabled,
    paymentMethod,
    percent: processingFeePercent,
    cashAppPercent,
    shippingCents
  })

  if (!isCryptoPaymentMethod(paymentMethod)) {
    return {
      processingFeeCents: processingFeeCents > 0 ? normalizeMoneyCents(processingFeeCents) : undefined,
      cryptoFeeCents: undefined,
      totalWithCryptoFeeCents: undefined
    }
  }

  const totalBeforeCryptoFeeCents =
    normalizeMoneyCents(discountedSubtotalCents) +
    normalizeMoneyCents(taxCents) +
    normalizeMoneyCents(shippingCents) +
    (processingFeeEnabled ? normalizeMoneyCents(processingFeeCents) : 0)
  const normalizedCryptoFeeAcc = Number.isFinite(cryptoFeeAcc) && cryptoFeeAcc > 0 ? cryptoFeeAcc : 1
  const totalWithCryptoFeeCents = Math.round(
    totalBeforeCryptoFeeCents * (cryptoFeeEnabled ? normalizedCryptoFeeAcc : 1)
  )

  return {
    processingFeeCents: processingFeeCents > 0 ? normalizeMoneyCents(processingFeeCents) : undefined,
    cryptoFeeCents: computeCryptoFeeCents({
      totalCents,
      totalWithCryptoFeeCents
    }),
    totalWithCryptoFeeCents
  }
}

export const resolveOrderPayableTotalCents = ({
  paymentMethod,
  totalCents,
  processingFeeCents,
  totalWithCryptoFeeCents
}: ResolveOrderPayableTotalCentsArgs) => {
  if (isCryptoPaymentMethod(paymentMethod)) {
    const normalizedTotalWithCryptoFeeCents = normalizeMoneyCents(totalWithCryptoFeeCents)

    if (normalizedTotalWithCryptoFeeCents > 0) {
      return normalizedTotalWithCryptoFeeCents
    }
  }

  if (paymentMethod === 'e_wallet') {
    return Math.max(0, normalizeMoneyCents(totalCents) + normalizeMoneyCents(processingFeeCents))
  }

  return normalizeMoneyCents(totalCents)
}

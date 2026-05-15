import { v } from 'convex/values'

export const orderStatus = v.union(v.literal('pending'), v.literal('completed'), v.literal('cancelled'))

export type OrderStatus = typeof orderStatus.type

export const orderFields = {
  refNumber: v.optional(v.string()),
  userId: v.string(),
  accountId: v.id('accounts'),
  currency: v.string(),
  status: orderStatus,
  totalCents: v.number(),
  processingFeeCents: v.number(),
  totalWithCryptoFeeCents: v.number(),
  payment: v.object({
    status: v.union(v.literal('pending'), v.literal('paid'), v.literal('cancelled')),
    txnId: v.string(),
    asset: v.union(v.string(), v.null()),
    chain: v.string(),
    nativeValue: v.number(),
    usdValue: v.number(),
    paidAt: v.number()
  })
}

export type OrderFields = typeof orderFields

export const orderSchema = v.object({
  ...orderFields,
  createdAt: v.number(),
  updatedAt: v.number()
})

export type Order = typeof orderSchema.type

import { ConvexError, v } from 'convex/values'
import { mutation, type MutationCtx } from '../_generated/server'
import { getUserByTokenIdentifier } from '../users/q'
import { orderFields } from './d'

const REF_NUMBER_PREFIX = 'ORD'

const normalizeCents = (value: number) => Math.max(0, Math.round(value))
const normalizeNumber = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0)
const centsToAmount = (value: number) => normalizeCents(value) / 100
const formatHistoryMonthLabel = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short'
  })

async function createUniqueRefNumber(db: MutationCtx['db']) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `${REF_NUMBER_PREFIX}-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 1_000_000
    )
      .toString()
      .padStart(6, '0')}`
    const existingOrder = await db
      .query('orders')
      .withIndex('by_refNumber', (q) => q.eq('refNumber', candidate))
      .unique()

    if (!existingOrder) {
      return candidate
    }
  }

  throw new ConvexError('Unable to generate an order reference number.')
}

export const createOrder = mutation({
  args: {
    accountId: v.id('accounts'),
    currency: v.string(),
    totalCents: v.number(),
    productId: v.string(),
    productName: v.string(),
    productDescription: v.string(),
    productLevel: v.number(),
    processingFeeCents: v.number(),
    totalWithCryptoFeeCents: v.number(),
    paymentAsset: v.union(v.string(), v.null()),
    paymentChain: v.string(),
    paymentUsdValue: v.number()
  },
  returns: v.object({
    id: v.id('orders'),
    refNumber: v.string()
  }),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)

    if (!account) {
      throw new ConvexError('Account not found.')
    }

    const refNumber = await createUniqueRefNumber(ctx.db)
    const now = Date.now()
    const totalCents = normalizeCents(args.totalCents)
    const processingFeeCents = normalizeCents(args.processingFeeCents)
    const totalWithCryptoFeeCents = normalizeCents(args.totalWithCryptoFeeCents)
    const id = await ctx.db.insert('orders', {
      refNumber,
      userId: account.sub,
      accountId: account._id,
      currency: args.currency,
      status: 'pending',
      totalCents,
      productId: args.productId,
      productName: args.productName,
      productDescription: args.productDescription,
      productLevel: Math.max(0, Math.round(args.productLevel)),
      processingFeeCents,
      totalWithCryptoFeeCents,
      payment: {
        status: 'pending',
        txnId: '',
        asset: args.paymentAsset,
        chain: args.paymentChain.trim(),
        nativeValue: 0,
        usdValue: normalizeNumber(args.paymentUsdValue),
        paidAt: 0
      },
      createdAt: now,
      updatedAt: now
    })

    return {
      id,
      refNumber
    }
  }
})

export const confirmOrderPayment = mutation({
  args: {
    id: v.id('orders'),
    txnId: v.string(),
    asset: v.optional(v.union(v.string(), v.null())),
    chain: v.optional(v.string()),
    nativeValue: v.optional(v.number()),
    usdValue: v.optional(v.number())
  },
  returns: v.object({
    orderId: v.id('orders'),
    stakeId: v.id('stakes')
  }),
  handler: async (ctx, { id, txnId: paymentTxnId, asset, chain, nativeValue, usdValue }) => {
    const order = await ctx.db.get(id)

    if (!order) {
      throw new ConvexError('Order not found.')
    }

    if (order.stakeId) {
      return {
        orderId: order._id,
        stakeId: order.stakeId
      }
    }

    const account = await ctx.db.get(order.accountId)

    if (!account) {
      throw new ConvexError('Account not found for order.')
    }

    const user = await getUserByTokenIdentifier(ctx, account.tokenIdentifier)

    if (!user) {
      throw new ConvexError('User not found for order account.')
    }

    const existingStakeIds = (account.stakes ?? []).flatMap((stakeId) => (stakeId ? [stakeId] : []))
    const existingStakes = await Promise.all(existingStakeIds.map((stakeId) => ctx.db.get(stakeId)))
    const currentBalance = existingStakes.reduce((total, stake) => total + (stake?.amount ?? 0), 0)
    const orderAmount = centsToAmount(order.totalCents)
    const now = Date.now()
    const stakeId = await ctx.db.insert('stakes', {
      accountId: order.accountId,
      userId: user._id,
      amount: orderAmount,
      title: order.productName,
      level: order.productLevel,
      isStaked: false,
      isActive: true,
      createdAt: now,
      updatedAt: now
    })

    const nextStakeIds = account.stakes ?? []
    await ctx.db.patch(order.accountId, {
      stakes: nextStakeIds.includes(stakeId) ? nextStakeIds : [...nextStakeIds, stakeId],
      updatedAt: now
    })

    const txnRecordId = await ctx.db.insert('txns', {
      userId: user._id,
      accountId: order.accountId,
      amount: orderAmount,
      title: order.productName,
      description: `Completed order ${order.refNumber}`,
      status: 'posted',
      createdAt: now,
      updatedAt: now
    })

    await ctx.db.insert('history', {
      userId: user._id,
      accountId: order.accountId,
      txnId: txnRecordId,
      amount: orderAmount,
      type: 'order_completed',
      change: orderAmount,
      changePct: currentBalance === 0 ? 0 : (orderAmount / currentBalance) * 100,
      summary: {
        label: formatHistoryMonthLabel(now),
        balance: currentBalance + orderAmount
      },
      createdAt: now,
      updatedAt: now
    })

    await ctx.db.patch(order._id, {
      payment: {
        status: 'paid',
        txnId: paymentTxnId,
        asset: asset === undefined ? order.payment.asset : asset,
        chain: chain?.trim() ? chain : order.payment.chain,
        nativeValue: nativeValue == null ? order.payment.nativeValue : nativeValue,
        usdValue: usdValue == null ? order.payment.usdValue : normalizeNumber(usdValue),
        paidAt: now
      },
      stakeId,
      status: 'completed',
      updatedAt: now
    })

    return {
      orderId: order._id,
      stakeId
    }
  }
})

export const updateOrder = mutation({
  args: { id: v.id('orders'), ...orderFields },
  handler: async (ctx, { id, ...value }) => {
    const order = await ctx.db.get(id)

    if (!order) {
      return null
    }

    if (order.status !== 'completed' && value.status === 'completed') {
      throw new ConvexError('Use confirmOrderPayment to complete an order.')
    }

    await ctx.db.patch(order._id, {
      ...value,
      updatedAt: Date.now()
    })

    return order._id
  }
})

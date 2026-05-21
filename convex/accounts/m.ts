import { ConvexError, v } from 'convex/values'
import { mutation } from '../_generated/server'
import { accountFieldSchema } from './d'
import { getUserByTokenIdentifier } from '../users/q'

const formatHistoryMonthLabel = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short'
  })

export const upsertByTokenId = mutation({
  args: accountFieldSchema,
  handler: async (ctx, args) => {
    const { db } = ctx
    const existingAcct = await db
      .query('accounts')
      .withIndex('by_sub', (q) => q.eq('sub', args.sub))
      .unique()

    const now = Date.now()

    if (existingAcct) {
      await db.patch(existingAcct._id, {
        ...args,
        updatedAt: now
      })

      return existingAcct._id
    }

    const user = await getUserByTokenIdentifier(ctx, args.tokenIdentifier)

    if (!user) {
      throw new ConvexError('Cannot create account history without an existing user.')
    }

    const accountId = await db.insert('accounts', {
      ...args,
      title: 'Account 1',
      stakes: [],
      createdAt: now,
      updatedAt: now
    })

    await db.insert('history', {
      userId: user._id,
      accountId,
      txnId: null,
      amount: 0,
      type: 'seed',
      change: 0,
      changePct: 0,
      summary: {
        label: formatHistoryMonthLabel(now),
        balance: 0
      },
      createdAt: now,
      updatedAt: now
    })

    return accountId
  }
})

export const updateTitle = mutation({
  args: { id: v.union(v.id('accounts'), v.null()), sub: v.string(), title: v.string() },
  handler: async ({ db }, { id, sub, title }) => {
    const existingAccts = await db
      .query('accounts')
      .withIndex('by_sub', (q) => q.eq('sub', sub))
      .collect()
    if (!existingAccts) {
      return null
    }
    if (id === null) {
      return null
    }

    const account = existingAccts.find((account) => account._id === id)

    if (!account) {
      return null
    }

    const now = Date.now()

    await db.patch(account._id, {
      title,
      updatedAt: now
    })

    return account._id
  }
})

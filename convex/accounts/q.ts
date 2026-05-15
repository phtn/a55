import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listAccounts = query({
  handler: async ({ db }) => {
    return await db.query('accounts').collect()
  }
})

export const getAccountsBySub = query({
  args: { sub: v.string() },
  handler: async ({ db }, { sub }) => {
    return await db
      .query('accounts')
      .withIndex('by_sub', (q) => q.eq('sub', sub))
      .collect()
  }
})

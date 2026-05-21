import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listByAccountId = query({
  args: { accountId: v.id('accounts') },
  handler: async ({ db }, { accountId }) => {
    const txns = await db
      .query('txns')
      .withIndex('by_accountId', (q) => q.eq('accountId', accountId))
      .collect()

    return txns.reverse()
  }
})

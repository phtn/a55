import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listByAccountId = query({
  args: { accountId: v.id('accounts') },
  handler: async ({ db }, { accountId }) => {
    const history = await db
      .query('history')
      .withIndex('by_accountId', (q) => q.eq('accountId', accountId))
      .collect()

    if (!history) return null
    return history
  }
})

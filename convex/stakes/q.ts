import { v } from 'convex/values'
import { query } from '../_generated/server'

export const listStakesByAccount = query({
  args: { accountId: v.id('accounts') },
  handler: async ({ db }, { accountId }) => {
    return await db
      .query('stakes')
      .withIndex('by_accountId', (q) => q.eq('accountId', accountId))
      .collect()
  }
})

export const listStakesById = query({
  args: { ids: v.union(v.array(v.union(v.id('stakes'), v.null())), v.null()) },
  handler: async ({ db }, { ids }) => {
    if (!ids || ids.includes(null)) {
      return []
    }
    const results = []
    for (const id of ids) {
      if (id === null) continue
      const doc = await db.get(id)
      if (doc !== null) {
        results.push(doc)
      }
    }
    return results
  }
})

export const listStakesByIdPromise = query({
  args: { ids: v.array(v.id('stakes')) },
  handler: async (ctx, args) => {
    return await Promise.all(args.ids.map((id) => ctx.db.get(id)))
  }
})

import { v } from 'convex/values'
import { query } from '../_generated/server'

export const getOrderByRefNumber = query({
  args: { refNumber: v.optional(v.string()) },
  handler: async ({ db }, { refNumber }) => {
    if (!refNumber) return null
    const order = await db
      .query('orders')
      .withIndex('by_refNumber', (q) => q.eq('refNumber', refNumber))
      .first()
    return order
  }
})

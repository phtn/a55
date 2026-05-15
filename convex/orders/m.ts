import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { orderFields } from './d'

export const updateOrder = mutation({
  args: { id: v.id('orders'), ...orderFields },
  handler: async ({ db }, { id, ...orderFields }) => {
    if (!orderFields.refNumber) return
    const order = await db.get('orders', id)
    if (!order) return
    return await db.patch(order._id, orderFields)
  }
})

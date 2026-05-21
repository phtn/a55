import { mutation } from '../_generated/server'
import { txnFields } from './d'

export const create = mutation({
  args: txnFields,
  handler: async ({ db }, args) => {
    return await db.insert('txns', { ...args, createdAt: Date.now(), updatedAt: Date.now() })
  }
})

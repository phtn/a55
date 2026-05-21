import { mutation } from '../_generated/server'
import { historyFields } from './d'

export const create = mutation({
  args: historyFields,
  handler: async ({ db }, args) => {
    return await db.insert('history', { ...args, createdAt: Date.now(), updatedAt: Date.now() })
  }
})

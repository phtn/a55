import { v } from 'convex/values'

export const historyFields = {
  userId: v.id('users'),
  accountId: v.id('accounts'),
  txnId: v.union(v.id('txns'), v.null()),
  amount: v.number(),
  type: v.string(),
  change: v.number(),
  changePct: v.number(),
  summary: v.object({
    label: v.string(),
    balance: v.number()
  })
}
export const historySchema = v.object({ ...historyFields, createdAt: v.number(), updatedAt: v.number() })

export type History = typeof historySchema.type

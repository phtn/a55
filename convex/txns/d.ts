import { v } from 'convex/values'

export const txnFields = {
  userId: v.id('users'),
  accountId: v.id('accounts'),
  amount: v.number(),
  title: v.string(),
  description: v.string(),
  status: v.string()
}
export const txnSchema = v.object({ ...txnFields, createdAt: v.number(), updatedAt: v.number() })

export type Txn = typeof txnSchema.type

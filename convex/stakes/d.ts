import { v } from 'convex/values'

export const stakeSchema = v.object({
  accountId: v.id('accounts'),
  userId: v.id('users'),
  amount: v.number(),
  title: v.string(),
  level: v.number(),
  isStaked: v.boolean(),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number()
})

export type Stake = typeof stakeSchema.type

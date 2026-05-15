import { v } from 'convex/values'

export const transactionsSchema = v.object({
  userId: v.id('users'),
  contactId: v.optional(v.id('contacts')),
  walletAddressId: v.optional(v.id('contact_wallet_addresses')),
  network: v.string(),
  address: v.string(),
  amount: v.string(),
  note: v.optional(v.string()),
  createdAt: v.number()
})

export type Transaction = typeof transactionsSchema.type

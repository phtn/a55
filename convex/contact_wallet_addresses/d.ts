import { v } from 'convex/values'

export const contactWalletAddressesSchema = v.object({
  userId: v.id('users'),
  contactId: v.id('contacts'),
  network: v.string(),
  label: v.union(v.string(), v.null()),
  address: v.string(),
  createdAt: v.number(),
  updatedAt: v.number()
})

export type ContactWalletAddress = typeof contactWalletAddressesSchema.type

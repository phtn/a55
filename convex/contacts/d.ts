import { v } from 'convex/values'

export const contactsSchema = v.object({
  userId: v.id('users'),
  name: v.string(),
  email: v.union(v.string(), v.null()),
  notes: v.union(v.string(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number()
})
export type Contact = typeof contactsSchema.type

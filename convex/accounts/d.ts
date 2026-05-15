import { v } from 'convex/values'

export const accountFields = {
  title: v.optional(v.string()),
  sub: v.string(),
  tokenIdentifier: v.string(),
  stakes: v.optional(v.array(v.union(v.id('stakes'), v.null())))
}
export const accountSchema = v.object({
  ...accountFields,
  createdAt: v.number(),
  updatedAt: v.number()
})
export const accountFieldSchema = v.object(accountFields)
export type AccountFields = typeof accountFieldSchema.type
export type Account = typeof accountSchema.type

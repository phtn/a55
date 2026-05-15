import { v } from 'convex/values'

const userIdentityFields = {
  tokenIdentifier: v.string(),
  subject: v.string(),
  issuer: v.string(),
  name: v.union(v.string(), v.null()),
  nickname: v.union(v.string(), v.null()),
  preferredUsername: v.union(v.string(), v.null()),
  profileUrl: v.union(v.string(), v.null()),
  pictureUrl: v.union(v.string(), v.null()),
  email: v.union(v.string(), v.null()),
  phone: v.union(v.string(), v.null()),
  emailVerified: v.union(v.boolean(), v.null())
}

export const userUpsertSchema = v.object(userIdentityFields)

export const userSchema = v.object({
  ...userIdentityFields,
  createdAt: v.number(),
  updatedAt: v.number()
})

export type UserIdentity = typeof userSchema.type
export type UserUpsertInput = typeof userUpsertSchema.type

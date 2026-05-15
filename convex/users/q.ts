import { v } from 'convex/values'
import { MutationCtx, query, QueryCtx } from '../_generated/server'

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect()
    return users
  }
})

export const getUserByTokenId = query({
  args: { tokenIdentifier: v.string() },
  handler: async ({ db }, { tokenIdentifier }) => {
    return await db
      .query('users')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier))
      .collect()
  }
})
export async function getCurrentIdentity(ctx: QueryCtx | MutationCtx) {
  return await ctx.auth.getUserIdentity()
}

export async function getUserByTokenIdentifier(ctx: QueryCtx | MutationCtx, tokenIdentifier: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', tokenIdentifier))
    .unique()
}

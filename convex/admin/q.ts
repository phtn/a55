import { v } from 'convex/values'
import { query } from '../_generated/server'

export const getAdminByIdentStrict = query({
  args: { identifier: v.string() },
  handler: async ({ db }, { identifier }) => {
    const setting = await db
      .query('admin')
      .withIndex('by_identifier', (q) => q.eq('identifier', identifier))
      .first()

    if (!setting) {
      return { error: `NOT_FOUND`, status: 404, message: identifier }
    }

    return setting.value
  }
})

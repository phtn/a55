import { defineSchema, defineTable } from 'convex/server'
import { accountSchema } from './accounts/d'
import { adminSchema } from './admin/d'
import { contactWalletAddressesSchema } from './contact_wallet_addresses/d'
import { contactsSchema } from './contacts/d'
import { orderSchema } from './orders/d'
import { stakeSchema } from './stakes/d'
import { transactionsSchema } from './transactions/d'
import { userCryptoWalletsSchema } from './user_crypto_wallets/d'
import { userSchema } from './users/d'

export default defineSchema({
  admin: defineTable(adminSchema).index('by_identifier', ['identifier']),
  users: defineTable(userSchema).index('by_name', ['name']).index('by_tokenIdentifier', ['tokenIdentifier']),
  contacts: defineTable(contactsSchema).index('by_userId', ['userId']),
  contact_wallet_addresses: defineTable(contactWalletAddressesSchema)
    .index('by_userId', ['userId'])
    .index('by_contactId', ['contactId']),
  user_crypto_wallets: defineTable(userCryptoWalletsSchema)
    .index('by_userId', ['userId'])
    .index('by_user_network', ['userId', 'networkKey'])
    .index('by_user_network_address', ['userId', 'networkKey', 'normalizedAddress'])
    .index('by_user_namespace_address', ['userId', 'chainNamespace', 'normalizedAddress'])
    .index('by_user_primary_network', ['userId', 'networkKey', 'isPrimary'])
    .index('by_user_archived', ['userId', 'isArchived'])
    .index('by_user_walletType', ['userId', 'walletType']),
  transactions: defineTable(transactionsSchema).index('by_userId', ['userId']),
  accounts: defineTable(accountSchema).index('by_sub', ['sub']),
  stakes: defineTable(stakeSchema).index('by_userId', ['userId']).index('by_accountId', ['accountId']),
  orders: defineTable(orderSchema).index('by_refNumber', ['refNumber'])
})

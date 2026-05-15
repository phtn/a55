import { v } from 'convex/values'

export const userCryptoWalletsSchema = v.object({
  userId: v.id('users'),
  walletName: v.string(),
  description: v.union(v.string(), v.null()),
  tags: v.array(v.string()),
  address: v.string(),
  normalizedAddress: v.string(),
  chainNamespace: v.union(v.literal('eip155'), v.literal('bip122'), v.literal('solana'), v.literal('other')),
  networkKey: v.string(),
  networkName: v.string(),
  chainId: v.union(v.number(), v.null()),
  caipNetworkId: v.union(v.string(), v.null()),
  walletType: v.union(
    v.literal('self_custody'),
    v.literal('hardware'),
    v.literal('exchange'),
    v.literal('custodial'),
    v.literal('smart_contract'),
    v.literal('watch_only')
  ),
  addressType: v.union(
    v.literal('personal'),
    v.literal('deposit'),
    v.literal('withdrawal'),
    v.literal('multisig'),
    v.literal('contract'),
    v.literal('unknown')
  ),
  provider: v.union(v.string(), v.null()),
  source: v.union(v.literal('manual'), v.literal('wallet_connect'), v.literal('imported'), v.literal('system')),
  assets: v.array(
    v.object({
      assetKey: v.string(),
      symbol: v.string(),
      name: v.string(),
      assetType: v.union(
        v.literal('native'),
        v.literal('erc20'),
        v.literal('spl'),
        v.literal('brc20'),
        v.literal('other')
      ),
      contractAddress: v.union(v.string(), v.null()),
      decimals: v.union(v.number(), v.null()),
      cmcId: v.union(v.number(), v.null()),
      enabled: v.boolean(),
      sortOrder: v.number()
    })
  ),
  isPrimary: v.boolean(),
  isArchived: v.boolean(),
  isVerified: v.boolean(),
  verifiedAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number()
})

export type UserCryptoWallets = typeof userCryptoWalletsSchema.type

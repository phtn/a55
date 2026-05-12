import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { AppKitNetwork, bitcoin, mainnet, polygon, sepolia } from '@reown/appkit/networks'
import { cookieStorage, createStorage } from '@wagmi/core'

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_REOWN_ID as string

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bitcoin, sepolia, mainnet, polygon]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const bitcoinAdapter = new BitcoinAdapter({
  projectId
})

export const config = wagmiAdapter.wagmiConfig

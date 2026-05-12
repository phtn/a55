import { cn } from '@/lib/utils'
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { config } from '@/ctx/wagmi/config'
import { useCrypto } from '@/hooks/use-crypto'
import { useAppKitAccount } from '@reown/appkit/react'
import { getBalance } from '@wagmi/core'
import { formatUnits, isAddress } from 'viem'
import { polygon, polygonAmoy, sepolia, zeroGGalileoTestnet, zeroGMainnet } from 'viem/chains'
import { useChainId, useChains } from 'wagmi'
import { Icon } from '../icons'

type AllowedNet = 'eth' | 'sepolia' | 'polygon' | 'amoy' | 'bitcoin'

export const Wallet = () => {
  const { address } = useAppKitAccount({ namespace: 'eip155' })
  const evmAddress = useMemo(() => {
    if (!address) return undefined
    return isAddress(address) ? address : undefined
  }, [address])
  const { getBySymbol } = useCrypto()
  const chainId = useChainId()
  const chains = useChains()

  const currentChain = useMemo(() => chains.find((chain) => chain.id === chainId), [chains, chainId])
  // const networkName = useMemo(() => currentChain?.name ?? 'Unknown', [currentChain])
  const nc = currentChain?.nativeCurrency.symbol
  const chainBalId = useMemo(() => {
    if (chainId === 1) return 1
    if (chainId === sepolia.id) return sepolia.id
    if (chainId === polygon.id) return polygon.id
    if (chainId === polygonAmoy.id) return polygonAmoy.id
    if (chainId === zeroGMainnet.id) return zeroGMainnet.id
    if (chainId === zeroGGalileoTestnet.id) return zeroGGalileoTestnet.id
  }, [chainId])

  // Map chainId to AllowedNet type
  const networkId = useMemo((): AllowedNet | null => {
    if (chainId === 1) return 'eth'
    if (chainId === sepolia.id) return 'sepolia'
    if (chainId === polygon.id) return 'polygon'
    if (chainId === polygonAmoy.id) return 'amoy'
    return null
  }, [chainId])

  const getBal = useCallback(async () => {
    if (!evmAddress || !chainBalId) return null

    const balance = await getBalance(config, {
      address: evmAddress,
      chainId: chainBalId
    })
    // formatUnits converts wei → human-readable string
    const formattedBal = formatUnits(balance.value, balance.decimals)
    const balanceAsNumber = Number(formattedBal)

    const currentPrice = getBySymbol(balance.symbol)?.price

    if (!currentPrice) {
      return null
    }

    const usdValue = balanceAsNumber * currentPrice
    console.table({
      'Balance ': balanceAsNumber,
      'USD Value': usdValue,
      symbol: balance.symbol,
      native: nc
    })

    return usdValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      unitDisplay: 'narrow',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      currencyDisplay: 'symbol'
    })
  }, [evmAddress, chainBalId, getBySymbol, nc])

  const [balance, setBalance] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const prevNetworkIdRef = useRef<AllowedNet | null>(null)
  const prevAddressRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (evmAddress && networkId && !isFetching) {
      // Fetch if network changed or address changed
      const networkChanged = prevNetworkIdRef.current !== networkId
      const addressChanged = prevAddressRef.current !== evmAddress

      if (networkChanged || addressChanged) {
        prevNetworkIdRef.current = networkId
        prevAddressRef.current = evmAddress

        startTransition(() => {
          setIsFetching(true)
          setBalance(null)
        })

        getBal()
          .then((result) => {
            startTransition(() => {
              setBalance(result)
              setIsFetching(false)
            })
          })
          .catch((error) => {
            console.error(error)
            startTransition(() => {
              setIsFetching(false)
            })
          })
      }
    }
  }, [evmAddress, networkId, getBal, isFetching])

  return (
    <div className={cn('flex items-center')}>
      <div className='flex items-center justify-end whitespace-nowrap text-xs pr-2 rounded-full overflow-hidden bg-[#252525] border border-accent/80 text-accent!'>
        <WalletConnector />
      </div>
    </div>
  )
}
const WalletConnector = () => {
  return <w3m-account-button balance='hide' />
}
export const WalletAvatar = () => {
  return <Icon name='bet69' className='text-blu size-5' />
}
export const chainMap = {
  sepolia: sepolia.id,
  eth: 1,
  polygon: polygon.id,
  amoy: polygonAmoy.id
}

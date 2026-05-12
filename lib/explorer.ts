/**
 * Utilities for block explorer URLs.
 * Use these to make transaction hashes and addresses linkable.
 */

type ChainWithExplorer = {
  blockExplorers?: {
    default?: { url: string; name?: string }
    [key: string]: { url: string; name?: string } | undefined
  }
}

/**
 * Returns the block explorer URL for a transaction hash on the given chain.
 * Use for linking tx hashes (e.g. `${url}/tx/${hash}`).
 *
 * @param chain - Chain from useChains() or similar (must have blockExplorers.default)
 * @param hash - Transaction hash (0x...)
 * @returns Full URL to the transaction on the explorer, or null if not available
 */
export function getTransactionExplorerUrl(
  chain: ChainWithExplorer | null | undefined,
  hash: `0x${string}` | string | null | undefined
): string | null {
  const base = chain?.blockExplorers?.default?.url
  if (!base || !hash || typeof hash !== 'string') return null
  const trimmed = hash.trim()
  if (!trimmed.startsWith('0x')) return null
  return `${base.replace(/\/$/, '')}/tx/${trimmed}`
}

/**
 * Returns the block explorer URL for an address on the given chain.
 *
 * @param chain - Chain from useChains() or similar
 * @param address - Address (0x...)
 * @returns Full URL to the address on the explorer, or null if not available
 */
export function getAddressExplorerUrl(
  chain: ChainWithExplorer | null | undefined,
  address: `0x${string}` | string | null | undefined
): string | null {
  const base = chain?.blockExplorers?.default?.url
  if (!base || !address || typeof address !== 'string') return null
  const trimmed = address.trim()
  if (!trimmed.startsWith('0x')) return null
  return `${base.replace(/\/$/, '')}/address/${trimmed}`
}

/**
 * Returns the default block explorer display name for the chain.
 */
export function getExplorerName(chain: ChainWithExplorer | null | undefined): string {
  return chain?.blockExplorers?.default?.name ?? 'Explorer'
}

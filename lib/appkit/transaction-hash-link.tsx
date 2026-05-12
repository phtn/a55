'use client'

import {cn} from '@/lib/utils'

export interface TransactionHashLinkProps {
  hash: `0x${string}` | null | undefined
  explorerUrl: string | null | undefined
  /** Truncate to "0x1234...abcd" style. Default true. */
  truncate?: boolean
  className?: string
  linkClassName?: string
}

/**
 * Renders a transaction hash as a link to the block explorer when explorerUrl
 * is available; otherwise plain text. Use with getTransactionExplorerUrl().
 */
export function TransactionHashLink({
  hash,
  explorerUrl,
  truncate = true,
  className,
  linkClassName,
}: TransactionHashLinkProps) {
  if (!hash) return null

  const display = truncate ? `${hash.substring(0, 10)}...` : hash

  if (explorerUrl) {
    return (
      <a
        href={explorerUrl}
        target='_blank'
        rel='noopener noreferrer'
        className={cn(
          'font-mono underline truncate text-emerald-300 hover:text-emerald-200',
          linkClassName,
          className,
        )}>
        {display}
      </a>
    )
  }

  return (
    <span className={cn('font-mono truncate text-white/60', className)}>
      {display}
    </span>
  )
}

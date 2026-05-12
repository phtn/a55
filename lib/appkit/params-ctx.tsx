'use client'

import { parseAsString, useQueryStates } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { createContext, useContext, type ReactNode } from 'react'

// Define search param parsers
const searchParamsSchema = {
  tabId: parseAsString.withDefault('pay'),
  network: parseAsString,
  tokenSelected: parseAsString,
  walletAddress: parseAsString,
  // Legacy param kept for backward compatibility with existing shared URLs.
  btcAddress: parseAsString,
  amount: parseAsString,
  to: parseAsString,
  paymentAmountUsd: parseAsString
}

type SearchParams = {
  tabId: string // Has default value, so never null
  network: string | null
  tokenSelected: string | null
  walletAddress: string | null
  btcAddress: string | null
  amount: string | null
  to: string | null
  paymentAmountUsd: string | null
}

type SearchParamsContextType = {
  params: SearchParams
  setParams: (updates: Partial<SearchParams> | null) => Promise<URLSearchParams>
}

const SearchParamsContext = createContext<SearchParamsContextType | null>(null)

// Internal hook that uses nuqs
function useSearchParamsInternal() {
  return useQueryStates(searchParamsSchema, {
    history: 'push',
    shallow: false
  })
}

// Provider component that wraps children with NuqsAdapter and provides context
export function SearchParamsProvider({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <SearchParamsContextInner>{children}</SearchParamsContextInner>
    </NuqsAdapter>
  )
}

// Inner component that has access to nuqs hooks
function SearchParamsContextInner({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParamsInternal()

  const contextValue: SearchParamsContextType = {
    params: {
      tabId: params.tabId, // Has default, so always a string
      network: params.network ?? null,
      tokenSelected: params.tokenSelected ?? null,
      walletAddress: params.walletAddress ?? null,
      btcAddress: params.btcAddress ?? null,
      amount: params.amount ?? null,
      to: params.to ?? null,
      paymentAmountUsd: params.paymentAmountUsd ?? null
    },
    setParams: async (updates) => {
      if (updates === null) {
        return await setParams(null)
      }
      return await setParams(updates)
    }
  }

  return <SearchParamsContext.Provider value={contextValue}>{children}</SearchParamsContext.Provider>
}

// Hook to use search params context
export function useSearchParams() {
  const context = useContext(SearchParamsContext)
  if (!context) {
    throw new Error('useSearchParams must be used within SearchParamsProvider')
  }
  return context
}

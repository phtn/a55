'use client'

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

interface OverviewPrefetchContextValue {
  isOverviewLoaded: boolean
  setIsOverviewLoaded: Dispatch<SetStateAction<boolean>>
}

const OverviewPrefetchContext = createContext<OverviewPrefetchContextValue | null>(null)

export const OverviewPrefetchProvider = ({ children }: { children: ReactNode }) => {
  const [isOverviewLoaded, setIsOverviewLoaded] = useState(false)

  return (
    <OverviewPrefetchContext.Provider value={{ isOverviewLoaded, setIsOverviewLoaded }}>
      {children}
    </OverviewPrefetchContext.Provider>
  )
}

export const useOverviewPrefetch = () => {
  const context = useContext(OverviewPrefetchContext)

  if (!context) {
    throw new Error('useOverviewPrefetch must be used within an OverviewPrefetchProvider')
  }

  return context
}

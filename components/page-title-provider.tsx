'use client'

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'

interface PageTitleContextValue {
  title: string | null
  setTitle: Dispatch<SetStateAction<string | null>>
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null)

export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState<string | null>(null)

  return <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>
}

export const usePageTitle = () => {
  const context = useContext(PageTitleContext)

  if (!context) {
    throw new Error('usePageTitle must be used within a PageTitleProvider')
  }

  return context
}

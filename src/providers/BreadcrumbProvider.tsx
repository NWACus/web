'use client'

import { createContext, Dispatch, ReactNode, SetStateAction, use, useState } from 'react'

export type BreadcrumbContextType = {
  pageLabel: string | null
  setPageLabel: Dispatch<SetStateAction<string | null>>
}

const BreadcrumbContext = createContext<BreadcrumbContextType | null>(null)

export const BreadcrumbProvider = ({ children }: { children: ReactNode }) => {
  const [pageLabel, setPageLabel] = useState<string | null>(null)

  return (
    <BreadcrumbContext.Provider value={{ pageLabel, setPageLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export const useBreadcrumbs = (): BreadcrumbContextType => {
  const context = use(BreadcrumbContext)

  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider')
  }

  return context
}

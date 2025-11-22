'use client'

import { createContext, useContext, useState } from 'react'

type FiltersTotalContextType = {
  total: number
  setTotal: (total: number) => void
}

const FiltersTotalContext = createContext<FiltersTotalContextType | undefined>(undefined)

type FiltersTotalProviderProps = {
  initialTotal: number
  children: React.ReactNode
}

export const FiltersTotalProvider = ({ initialTotal, children }: FiltersTotalProviderProps) => {
  const [total, setTotal] = useState(initialTotal)

  return (
    <FiltersTotalContext.Provider value={{ total, setTotal }}>
      {children}
    </FiltersTotalContext.Provider>
  )
}

export const useFiltersTotalContext = () => {
  const context = useContext(FiltersTotalContext)
  if (context === undefined) {
    throw new Error('useFiltersTotalContext must be used within a FiltersTotalProvider')
  }
  return context
}

'use client'

import { createContext, Dispatch, ReactNode, SetStateAction, use, useState } from 'react'

export type NotFoundContextType = {
  isNotFound: boolean
  setIsNotFound: Dispatch<SetStateAction<boolean>>
}

const NotFoundContext = createContext<NotFoundContextType | null>(null)

export const NotFoundProvider = ({ children }: { children: ReactNode }) => {
  const [isNotFound, setIsNotFound] = useState(false)

  return (
    <NotFoundContext.Provider value={{ isNotFound, setIsNotFound }}>
      {children}
    </NotFoundContext.Provider>
  )
}

export const useNotFound = (): NotFoundContextType => {
  const context = use(NotFoundContext)

  if (!context) {
    throw new Error('useNotFound must be used within a NotFoundProvider')
  }

  return context
}

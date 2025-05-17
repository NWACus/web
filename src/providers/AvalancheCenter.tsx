'use client'

import { AvalancheCenter, AvalancheCenterPlatforms } from '@/services/nac/types/schemas'
import React, { createContext, use } from 'react'

export interface ContextType {
  platforms: AvalancheCenterPlatforms | null
  metadata: AvalancheCenter | null
}

const initialContext: ContextType = {
  platforms: null,
  metadata: null,
}

const AvalancheCenterContext = createContext(initialContext)

export const AvalancheCenterProvider = ({
  platforms,
  metadata,
  children,
}: {
  platforms: AvalancheCenterPlatforms
  metadata: AvalancheCenter
  children: React.ReactNode
}) => {
  return <AvalancheCenterContext value={{ platforms, metadata }}>{children}</AvalancheCenterContext>
}

export const useAvalancheCenter = (): ContextType => use(AvalancheCenterContext)

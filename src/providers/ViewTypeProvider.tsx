'use client'
import React, { createContext, use, useState } from 'react'

export type ViewType = 'document' | 'list' | 'dashboard' | 'create' | 'edit' | 'unknown'

interface ViewTypeContextValue {
  viewType: ViewType
  setViewType: (viewType: ViewType) => void
}

const ViewTypeContext = createContext<ViewTypeContextValue>({
  viewType: 'unknown',
  setViewType: () => {},
})

export function ViewTypeProvider({ children }: { children: React.ReactNode }) {
  const [viewType, setViewType] = useState<ViewType>('unknown')

  return <ViewTypeContext value={{ viewType, setViewType }}>{children}</ViewTypeContext>
}

export const useViewType = () => use(ViewTypeContext).viewType
export const useSetViewType = () => use(ViewTypeContext).setViewType

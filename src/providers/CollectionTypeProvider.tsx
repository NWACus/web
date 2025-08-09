'use client'
import React, { createContext, useContext, useState } from 'react'

export type CollectionType = 'collection' | 'global' | 'global-collection' | 'unknown'

interface CollectionTypeContextValue {
  collectionType: CollectionType
  setCollectionType: (collectionType: CollectionType) => void
}

const CollectionTypeContext = createContext<CollectionTypeContextValue>({
  collectionType: 'unknown',
  setCollectionType: () => {},
})

export function CollectionTypeProvider({ children }: { children: React.ReactNode }) {
  const [collectionType, setCollectionType] = useState<CollectionType>('unknown')

  return (
    <CollectionTypeContext.Provider value={{ collectionType, setCollectionType }}>
      {children}
    </CollectionTypeContext.Provider>
  )
}

export const useCollectionType = () => useContext(CollectionTypeContext).collectionType
export const useSetCollectionType = () => useContext(CollectionTypeContext).setCollectionType

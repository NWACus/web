'use client'

import { CollectionType, useSetCollectionType } from '@/providers/CollectionTypeProvider'
import { useDocumentInfo } from '@payloadcms/ui'
import React, { useEffect } from 'react'

const CollectionTypeAction: React.FC = () => {
  const doc = useDocumentInfo()
  const setCollectionType = useSetCollectionType()

  useEffect(() => {
    if (doc.collectionSlug) {
      setCollectionType(doc.collectionSlug as CollectionType)
    }
  }, [doc.collectionSlug, setCollectionType])

  return null
}

export default CollectionTypeAction

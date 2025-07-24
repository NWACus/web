'use client'
import { useSetViewType, type ViewType } from '@/providers/ViewTypeProvider'
import React, { useEffect } from 'react'

interface ViewTypeActionProps {
  viewType: ViewType
}

const ViewTypeAction: React.FC<ViewTypeActionProps> = ({ viewType }) => {
  const setViewType = useSetViewType()

  useEffect(() => {
    setViewType(viewType)
  }, [viewType, setViewType])

  return null
}

export default ViewTypeAction

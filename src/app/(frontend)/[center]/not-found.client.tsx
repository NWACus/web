'use client'

import { useNotFound } from '@/providers/NotFoundProvider'
import { useEffect } from 'react'

export default function NotFoundClient() {
  const { setIsNotFound } = useNotFound()

  useEffect(() => {
    setIsNotFound(true)
    return () => setIsNotFound(false)
  }, [setIsNotFound])

  return null
}

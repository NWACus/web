'use client'

import { clearAdminSessionMarker, setAdminSessionMarker } from '@/utilities/adminSessionMarker'
import { useAuth } from '@payloadcms/ui'
import { useEffect } from 'react'

/** Tells the public site whether to ask who is logged in. See AdminBar. */
export function AdminSessionMarker() {
  const { user } = useAuth()
  const userId = user?.id
  const isLoggedOut = user === null

  useEffect(() => {
    if (userId) {
      setAdminSessionMarker()
    } else if (isLoggedOut) {
      clearAdminSessionMarker()
    }
  }, [userId, isLoggedOut])

  return null
}

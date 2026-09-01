'use client'
import { matchesDevice } from '@/components/Announcements/announcementUtils'
import { isExpired } from '@/components/Announcements/isExpired'
import type { Announcement } from '@/payload-types'
import React, { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'

interface AnnouncementBannerContextValue {
  activeBanners: Announcement[]
  count: number
  collapsed: boolean
  collapse: () => void
  expand: () => void
  toggle: () => void
}

const AnnouncementBannerContext = createContext<AnnouncementBannerContextValue>({
  activeBanners: [],
  count: 0,
  collapsed: true,
  collapse: () => {},
  expand: () => {},
  toggle: () => {},
})

export function AnnouncementBannerProvider({
  banners,
  children,
}: {
  banners: Announcement[]
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(true)

  // Device targeting is viewport-based, so it can only be resolved on the client.
  // Until mounted we render every non-expired banner (matching the server) to avoid
  // a hydration mismatch; the effect then narrows the list by device — the same
  // client-side-check approach the pop-up renderer uses.
  const [deviceResolved, setDeviceResolved] = useState(false)
  useEffect(() => setDeviceResolved(true), [])

  const activeBanners = useMemo(
    () =>
      banners.filter(
        (banner) => !isExpired(banner) && (!deviceResolved || matchesDevice(banner.deviceTarget)),
      ),
    [banners, deviceResolved],
  )

  const collapse = useCallback(() => setCollapsed(true), [])
  const expand = useCallback(() => setCollapsed(false), [])
  const toggle = useCallback(() => setCollapsed((prev) => !prev), [])

  return (
    <AnnouncementBannerContext
      value={{ activeBanners, count: activeBanners.length, collapsed, collapse, expand, toggle }}
    >
      {children}
    </AnnouncementBannerContext>
  )
}

export const useAnnouncementBanners = () => use(AnnouncementBannerContext)

'use client'
import { matchesDevice } from '@/components/Announcements/announcementUtils'
import { isExpired } from '@/components/Announcements/isExpired'
import type { Announcement } from '@/payload-types'
import React, { createContext, use, useCallback, useMemo, useState } from 'react'

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

  // Device targeting reads the viewport. That is safe during render because the banners come
  // from a browser fetch: the list is empty on the server and on the first client render.
  const activeBanners = useMemo(
    () => banners.filter((banner) => !isExpired(banner) && matchesDevice(banner.deviceTarget)),
    [banners],
  )

  const collapse = useCallback(() => setCollapsed(true), [])
  const expand = useCallback(() => setCollapsed(false), [])
  const toggle = useCallback(() => setCollapsed((prev) => !prev), [])

  return (
    <AnnouncementBannerContext
      value={{
        activeBanners,
        count: activeBanners.length,
        collapsed,
        collapse,
        expand,
        toggle,
      }}
    >
      {children}
    </AnnouncementBannerContext>
  )
}

export const useAnnouncementBanners = () => use(AnnouncementBannerContext)

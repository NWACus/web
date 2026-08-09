'use client'
import React, { createContext, use, useCallback, useState } from 'react'

interface AnnouncementBannerContextValue {
  count: number
  collapsed: boolean
  collapse: () => void
  expand: () => void
  toggle: () => void
}

const AnnouncementBannerContext = createContext<AnnouncementBannerContextValue>({
  count: 0,
  collapsed: true,
  collapse: () => {},
  expand: () => {},
  toggle: () => {},
})

export function AnnouncementBannerProvider({
  count,
  children,
}: {
  count: number
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(true)

  const collapse = useCallback(() => setCollapsed(true), [])
  const expand = useCallback(() => setCollapsed(false), [])
  const toggle = useCallback(() => setCollapsed((prev) => !prev), [])

  return (
    <AnnouncementBannerContext value={{ count, collapsed, collapse, expand, toggle }}>
      {children}
    </AnnouncementBannerContext>
  )
}

export const useAnnouncementBanners = () => use(AnnouncementBannerContext)

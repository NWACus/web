'use client'

import type { Announcement } from '@/payload-types'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import RichText from '../RichText'
import { isExpired } from './isExpired'

const STORAGE_KEY = 'announcement-banners'

interface BannerState {
  collapsed: boolean
  seenIds: number[]
}

function getStoredState(): BannerState {
  if (typeof window === 'undefined') return { collapsed: false, seenIds: [] }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // Ignore parse errors
  }
  return { collapsed: false, seenIds: [] }
}

function setStoredState(state: BannerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

interface AnnouncementBannersProps {
  banners: Announcement[]
}

export function AnnouncementBanners({ banners }: AnnouncementBannersProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [seenIds, setSeenIds] = useState<number[]>([])
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  const activeBanners = banners.filter((b) => !isExpired(b))

  useEffect(() => {
    if (!contentRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.contentRect.height)
      }
    })
    observer.observe(contentRef.current)
    return () => observer.disconnect()
  }, [activeBanners.length])

  useEffect(() => {
    const stored = getStoredState()
    const hasUnseenBanners = activeBanners.some((b) => !stored.seenIds.includes(b.id))

    if (hasUnseenBanners) {
      setCollapsed(false)
      const newSeenIds = [...new Set([...stored.seenIds, ...activeBanners.map((b) => b.id)])]
      setSeenIds(newSeenIds)
      setStoredState({ collapsed: false, seenIds: newSeenIds })
    } else {
      setCollapsed(stored.collapsed)
      setSeenIds(stored.seenIds)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCollapse = useCallback(() => {
    setCollapsed(true)
    setStoredState({ collapsed: true, seenIds })
  }, [seenIds])

  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('a, button:not([aria-label="Collapse announcements"])')
      ) {
        handleCollapse()
      }
    },
    [handleCollapse],
  )

  const handleExpand = useCallback(() => {
    setCollapsed(false)
    setStoredState({ collapsed: false, seenIds })
  }, [seenIds])

  if (activeBanners.length === 0) return null

  return (
    <>
      <div
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: collapsed ? 0 : contentHeight }}
      >
        <div ref={contentRef} className="relative bg-callout" onClick={handleContentClick}>
          {activeBanners.map((banner, index) => (
            <Fragment key={banner.id}>
              {index > 0 && <hr className="container mx-auto border-callout-foreground/25" />}
              <div className="bg-callout px-4 py-3 text-callout-foreground">
                <div className="container mx-auto">
                  <h3 className="mb-1 font-semibold">{banner.title}</h3>
                  {banner.content && (
                    <RichText
                      data={banner.content}
                      enableGutter={false}
                      className="prose-sm max-w-none [&_p]:mb-2 [&_p_a]:text-callout-foreground [&_p_a]:underline [&_p_a]:decoration-callout-foreground/50 hover:[&_p_a]:decoration-callout-foreground [&_.my-4]:mt-0 [&_.my-4]:mb-4 [&_.my-4:last-child]:mb-1 [&_.my-4_a]:h-9 [&_.my-4_a]:px-3"
                    />
                  )}
                </div>
              </div>
            </Fragment>
          ))}
          <button
            onClick={handleCollapse}
            className="absolute right-0 top-0 flex items-center gap-1.5 px-4 py-1.5 text-sm text-callout-foreground transition-colors hover:bg-callout-foreground/10"
            aria-label="Collapse announcements"
          >
            Collapse
            <ChevronUp className="h-5 w-5" />
          </button>
        </div>
      </div>
      {collapsed && (
        <button
          onClick={handleExpand}
          className="fixed right-0 top-[64px] z-40 flex items-center gap-1.5 rounded-bl-md bg-callout px-4 py-1.5 text-sm font-medium text-callout-foreground shadow-md transition-colors hover:bg-callout/90 lg:top-0"
        >
          {activeBanners.length} {activeBanners.length === 1 ? 'Announcement' : 'Announcements'}
          <ChevronDown className="h-5 w-5" />
        </button>
      )}
    </>
  )
}

'use client'

import type { Announcement } from '@/payload-types'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import RichText from '../RichText'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { matchesPage, shouldShow } from './announcementUtils'
import { isExpired } from './isExpired'

const STORAGE_KEY_PREFIX = 'announcement-popup-'
const POPUP_DELAY_MS = 1000
const MOBILE_BREAKPOINT = 768

interface PopupState {
  dismissed: boolean
  visitCount: number
}

function getPopupState(id: number): PopupState {
  if (typeof window === 'undefined') return { dismissed: false, visitCount: 0 }
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`)
    if (stored) return JSON.parse(stored)
  } catch {
    // Ignore parse errors
  }
  return { dismissed: false, visitCount: 0 }
}

function setPopupState(id: number, state: PopupState) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(state))
  } catch {
    // Ignore storage errors
  }
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

function matchesDevice(target: Announcement['deviceTarget']): boolean {
  if (!target || target === 'all') return true
  if (target === 'mobile_only') return isMobile()
  if (target === 'desktop_only') return !isMobile()
  return true
}

interface AnnouncementPopupProps {
  popup: Announcement
  center: string
}

export function AnnouncementPopup({ popup, center }: AnnouncementPopupProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isExpired(popup)) return
    if (!matchesDevice(popup.deviceTarget)) return
    if (!matchesPage(popup.pageScope, pathname, center)) return

    const state = getPopupState(popup.id)

    if (state.dismissed) return

    const newVisitCount = state.visitCount + 1
    setPopupState(popup.id, { ...state, visitCount: newVisitCount })

    if (!shouldShow(popup, newVisitCount - 1)) return

    const timer = setTimeout(() => {
      setOpen(true)
    }, POPUP_DELAY_MS)

    return () => clearTimeout(timer)
  }, [popup, pathname, center])

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        if (popup.displayFrequency === 'once') {
          const state = getPopupState(popup.id)
          setPopupState(popup.id, { ...state, dismissed: true })
        }
      }
      setOpen(isOpen)
    },
    [popup.displayFrequency, popup.id],
  )

  const handleDontShowAgain = useCallback(() => {
    const state = getPopupState(popup.id)
    setPopupState(popup.id, { ...state, dismissed: true })
    setOpen(false)
  }, [popup.id])

  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button:not([aria-label])')) {
        handleOpenChange(false)
      }
    },
    [handleOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[600px]" onClick={handleContentClick}>
        <DialogHeader>
          <DialogTitle className="text-2xl">{popup.title}</DialogTitle>
          <DialogDescription className="sr-only">Announcement</DialogDescription>
        </DialogHeader>
        {popup.content && (
          <RichText
            data={popup.content}
            enableGutter={false}
            className="max-w-none [&_.my-4]:my-0"
          />
        )}
        <button
          onClick={handleDontShowAgain}
          className="absolute bottom-2 right-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Don&apos;t show this again
        </button>
      </DialogContent>
    </Dialog>
  )
}

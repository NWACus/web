'use client'

import type { Announcement } from '@/payload-types'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import RichText from '../RichText'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { matchesPage, shouldShow } from './announcementUtils'
import { isExpired } from './isExpired'

const STORAGE_KEY_PREFIX = 'announcement-popup-'
const SESSION_KEY_PREFIX = 'announcement-popup-shown-'
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

function isSessionShown(id: number): boolean {
  try {
    return sessionStorage.getItem(`${SESSION_KEY_PREFIX}${id}`) !== null
  } catch {
    return false
  }
}

function markSessionShown(id: number) {
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${id}`, '1')
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
  popups: Announcement[]
  center: string
}

export function AnnouncementPopup({ popups, center }: AnnouncementPopupProps) {
  const [activePopup, setActivePopup] = useState<Announcement | null>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    // Eligible popups, in priority order.
    const targeted = popups.filter(
      (popup) =>
        !isExpired(popup) &&
        matchesDevice(popup.deviceTarget) &&
        matchesPage(popup.pageScope, pathname, center) &&
        !getPopupState(popup.id).dismissed,
    )

    // Of those, the ones their frequency rule clears for this view.
    const ready = targeted.filter((popup) => {
      if (popup.displayFrequency === 'every_session' && isSessionShown(popup.id)) return false
      return shouldShow(popup, getPopupState(popup.id).visitCount)
    })

    // Show one popup per page view; revisiting rotates to the next one.
    const toShow = ready[0] ?? null

    // Advance the clock for the shown popup and any throttled by their own rule.
    // Ready-but-deferred popups keep their turn so they show on the next visit.
    for (const popup of targeted) {
      if (popup === toShow || !ready.includes(popup)) {
        const state = getPopupState(popup.id)
        setPopupState(popup.id, { ...state, visitCount: state.visitCount + 1 })
      }
    }

    if (!toShow) return

    // For "every_session", only show once per browser session
    if (toShow.displayFrequency === 'every_session') {
      markSessionShown(toShow.id)
    }

    const timer = setTimeout(() => {
      setActivePopup(toShow)
      setOpen(true)
    }, POPUP_DELAY_MS)

    return () => clearTimeout(timer)
  }, [popups, pathname, center])

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && activePopup?.displayFrequency === 'once') {
        const state = getPopupState(activePopup.id)
        setPopupState(activePopup.id, { ...state, dismissed: true })
      }
      setOpen(isOpen)
    },
    [activePopup],
  )

  const handleDontShowAgain = useCallback(() => {
    if (!activePopup) return
    const state = getPopupState(activePopup.id)
    setPopupState(activePopup.id, { ...state, dismissed: true })
    setOpen(false)
  }, [activePopup])

  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button:not([aria-label])')) {
        handleOpenChange(false)
      }
    },
    [handleOpenChange],
  )

  if (!activePopup) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[600px] gap-0"
        onClick={handleContentClick}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl pb-4">{activePopup.title}</DialogTitle>
          <DialogDescription className="sr-only">Announcement</DialogDescription>
        </DialogHeader>
        {activePopup.content && (
          <RichText
            data={activePopup.content}
            enableGutter={false}
            className="max-w-none [&_.my-4]:my-0"
          />
        )}
        <button
          onClick={handleDontShowAgain}
          type="button"
          className="justify-self-end text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Don&apos;t show this again
        </button>
      </DialogContent>
    </Dialog>
  )
}

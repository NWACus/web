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
  // Ready popups for the current page view, shown one at a time in order.
  const [queue, setQueue] = useState<Announcement[]>([])
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const activePopup = queue[index] ?? null

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Build the queue of popups to show on this view.
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

    // Advance the clock for popups throttled by their own rule. Ready popups are
    // counted only when actually shown, so one the user never reaches keeps its turn.
    for (const popup of targeted) {
      if (!ready.includes(popup)) {
        const state = getPopupState(popup.id)
        setPopupState(popup.id, { ...state, visitCount: state.visitCount + 1 })
      }
    }

    setQueue(ready)
    setIndex(0)
  }, [popups, pathname, center])

  // Show the current popup (delayed for the first), counting it as seen now.
  useEffect(() => {
    const popup = queue[index]
    if (!popup) return

    const timer = setTimeout(
      () => {
        const state = getPopupState(popup.id)
        setPopupState(popup.id, { ...state, visitCount: state.visitCount + 1 })
        if (popup.displayFrequency === 'every_session') markSessionShown(popup.id)
        setOpen(true)
      },
      index === 0 ? POPUP_DELAY_MS : 0,
    )

    return () => clearTimeout(timer)
  }, [queue, index])

  // Close the current popup and advance to the next ready one, if any.
  const dismiss = useCallback(() => {
    setOpen(false)
    setIndex((i) => (i + 1 < queue.length ? i + 1 : i))
  }, [queue.length])

  const markDismissedIfOnce = useCallback(() => {
    if (activePopup?.displayFrequency === 'once') {
      const state = getPopupState(activePopup.id)
      setPopupState(activePopup.id, { ...state, dismissed: true })
    }
  }, [activePopup])

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setOpen(true)
        return
      }
      markDismissedIfOnce()
      dismiss()
    },
    [markDismissedIfOnce, dismiss],
  )

  const handleDontShowAgain = useCallback(() => {
    if (!activePopup) return
    const state = getPopupState(activePopup.id)
    setPopupState(activePopup.id, { ...state, dismissed: true })
    dismiss()
  }, [activePopup, dismiss])

  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target instanceof HTMLElement && e.target.closest('a, button:not([aria-label])')) {
        // A link/button navigates away; close without advancing — the next page
        // builds its own queue.
        markDismissedIfOnce()
        setOpen(false)
      }
    },
    [markDismissedIfOnce],
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

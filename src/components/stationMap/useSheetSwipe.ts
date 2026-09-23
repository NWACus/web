'use client'

/**
 * Touch gestures on the info panel: a horizontal swipe steps to the neighbouring point, and on a
 * phone — where the panel is a bottom sheet — dragging it down closes it, as the filter drawer
 * would. The readings inside scroll natively, so a downward drag only counts as a dismissal when
 * nothing under the finger has been scrolled; a vertical drag that begins anywhere else is left
 * to the browser.
 */
import { useCallback, useRef, useState, type TouchEvent } from 'react'

import { cssVariables } from '@/cssVariables'

/** How far a touch travels before the gesture commits to one axis. */
const AXIS_SLOP_PX = 10
/** Horizontal travel that reads as a swipe to the next or previous point. */
const STEP_DISTANCE_PX = 50
/** Downward travel that closes the sheet on release. */
const DISMISS_DISTANCE_PX = 80

const SHEET_QUERY = `(max-width: ${cssVariables.breakpoints.md - 1}px)`

interface Gesture {
  startX: number
  startY: number
  dx: number
  dy: number
  axis: 'x' | 'y' | null
  canDismiss: boolean
}

interface SheetSwipeOptions {
  onStep: (delta: 1 | -1) => void
  onClose: () => void
}

/** True unless something between the touch and the panel has already scrolled. */
function isScrolledToTop(target: EventTarget | null, panel: HTMLElement): boolean {
  let node = target instanceof HTMLElement ? target : null
  while (node && node !== panel) {
    if (node.scrollTop > 0) return false
    node = node.parentElement
  }
  return true
}

export function useSheetSwipe({ onStep, onClose }: SheetSwipeOptions) {
  const gesture = useRef<Gesture | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]
    if (!touch || event.touches.length > 1) return
    gesture.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      dx: 0,
      dy: 0,
      axis: null,
      canDismiss:
        window.matchMedia(SHEET_QUERY).matches &&
        isScrolledToTop(event.target, event.currentTarget),
    }
  }

  const onTouchMove = (event: TouchEvent<HTMLElement>) => {
    const current = gesture.current
    const touch = event.touches[0]
    if (!current || !touch) return
    current.dx = touch.clientX - current.startX
    current.dy = touch.clientY - current.startY
    if (!current.axis && Math.max(Math.abs(current.dx), Math.abs(current.dy)) > AXIS_SLOP_PX) {
      current.axis = Math.abs(current.dx) > Math.abs(current.dy) ? 'x' : 'y'
    }
    if (current.axis === 'y' && current.canDismiss) setDragOffset(Math.max(0, current.dy))
  }

  const resetDrag = useCallback(() => setDragOffset(0), [])

  const settle = () => {
    gesture.current = null
    setDragOffset(0)
  }

  const onTouchEnd = () => {
    const current = gesture.current
    if (!current) return
    if (current.axis === 'y' && current.canDismiss && current.dy >= DISMISS_DISTANCE_PX) {
      // Leave the sheet where the finger let go: its exit animation carries on from there.
      gesture.current = null
      onClose()
      return
    }
    if (current.axis === 'x' && Math.abs(current.dx) >= STEP_DISTANCE_PX) {
      onStep(current.dx < 0 ? 1 : -1)
    }
    settle()
  }

  return {
    /** How far the sheet is being dragged down, to move it with the finger. */
    dragOffset,
    resetDrag,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: settle },
  }
}

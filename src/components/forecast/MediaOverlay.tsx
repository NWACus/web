'use client'

import { Expand, Play } from 'lucide-react'

import { cn } from '@/utilities/ui'

/**
 * The affordances the legacy widget drew over an openable image: an expand chip in the bottom-left
 * corner, and a play button centered on a video.
 *
 * With `onOpen`, only the chip is a real button. That is what makes the media reachable by
 * keyboard — the legacy widget was click-only — while leaving the rest of the image untouched, so
 * right-clicking it still opens the image's own context menu. The legacy icons were
 * `pointer-events: none` for the same reason; mouse users open the lightbox by clicking the figure.
 * Without `onOpen` the chip is only a mark, for a tile that is itself the button.
 *
 * The parent must be positioned.
 */
export function MediaOverlay({ isVideo, onOpen }: { isVideo: boolean; onOpen?: () => void }) {
  const chipClassName = 'absolute bottom-1 left-1 rounded bg-white/70 p-1 text-gray-800'

  return (
    // Screen-only: an expand chip and a play button are meaningless on paper.
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center print:hidden">
      {isVideo && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60">
          <Play className="h-7 w-7 fill-white text-white" />
        </span>
      )}
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          aria-label={isVideo ? 'Play embedded video' : 'Expand embedded image'}
          className={cn(
            chipClassName,
            'pointer-events-auto hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <Expand className="h-4 w-4" />
        </button>
      ) : (
        <span aria-hidden className={chipClassName}>
          <Expand className="h-4 w-4" />
        </span>
      )}
    </span>
  )
}

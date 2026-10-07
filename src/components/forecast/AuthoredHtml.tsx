import { memo, type RefObject } from 'react'

/**
 * The authored HTML, isolated behind `memo` so it is written to the DOM once per distinct string.
 *
 * React compares the `dangerouslySetInnerHTML` wrapper by identity, so re-rendering this element
 * for any reason — opening the lightbox, say — replaces the whole subtree, detaching the figures
 * that were collected from it and stranding anything attached to them. Keeping it out of the
 * parent's update path is what makes those DOM references safe to hold.
 */
export const AuthoredHtml = memo(function AuthoredHtml({
  html,
  className,
  containerRef,
}: {
  html: string
  className?: string
  containerRef: RefObject<HTMLDivElement | null>
}) {
  return <div ref={containerRef} className={className} dangerouslySetInnerHTML={{ __html: html }} />
})

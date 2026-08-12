/**
 * The banners sit above the header in the page flow, so expanding them from a control that stays
 * put while the page scrolls — the sticky header's toggle, the fixed pill on desktop — grows them
 * off the top of the screen. Scroll anchoring then holds the reader's place, so nothing appears to
 * happen. Take them back to the top of the page, where the banners are.
 */
export function scrollAnnouncementsIntoView() {
  if (window.scrollY === 0) return

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
}

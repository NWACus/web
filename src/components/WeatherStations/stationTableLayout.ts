// Frozen column headers for the station tables.
//
// A sticky header resolves against the nearest scroll container, and the Table
// wrapper is one while it scrolls horizontally. Below xl the wrapper is capped
// at the viewport so it scrolls vertically too and the header sticks inside it,
// under the 4rem sticky site header on phones. From xl every station table fits
// its container (the widest, accumulated precipitation, is ~1140px in a 1216px
// container), so the wrapper stops scrolling and the header sticks to the
// viewport as the page scrolls instead.
//
// Collapsed row borders don't travel with a stuck header, so the cells draw
// their own bottom rule.
export const stationTableContainerClass =
  'max-h-[calc(100dvh-5rem)] lg:max-h-[calc(100dvh-2rem)] xl:max-h-none xl:overflow-visible'
export const stationTableHeaderClass =
  'sticky top-0 z-20 bg-background [&_th]:shadow-[inset_0_-1px_0_var(--border)]'

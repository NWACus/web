// Frozen column headers for the station tables.
//
// A sticky header resolves against the nearest scroll container, and the Table
// wrapper is one while it scrolls horizontally. From xl every station table fits
// its container (the widest, accumulated precipitation, is ~1140px in a 1216px
// container), so the wrapper stops scrolling there and the header sticks to the
// viewport as the page scrolls. Below xl the wrapper still scrolls sideways, so
// only the left column stays frozen.
//
// Collapsed row borders don't travel with a stuck header, so the cells draw
// their own bottom rule.
export const stationTableContainerClass = 'xl:overflow-visible'
export const stationTableHeaderClass =
  'xl:sticky xl:top-0 xl:z-20 xl:bg-background xl:[&_th]:shadow-[inset_0_-1px_0_var(--border)]'

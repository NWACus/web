// Sticky header cells resolve against their nearest scrolling ancestor, and
// shadcn's Table always wraps its table in an `overflow-auto` div. Left
// unbounded that div grows to the table's full height, so a `sticky top-0`
// header has nothing to stick to while the page scrolls past — which is why the
// left column froze but the header row didn't.
//
// Bounding the box to roughly the viewport gives both axes the same frame:
// header and left column hold while the rows scroll underneath. The reserved
// space is the sticky mobile site header (4rem, gone at lg) plus breathing room.
export const stickyTableScrollClass = 'max-h-[calc(100dvh-5rem)] lg:max-h-[calc(100dvh-2rem)]'

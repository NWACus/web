'use client'

import { cn } from '@/utilities/ui'

export type RailItem = { key: string; label: string; active: boolean; onSelect: () => void }
export type RailSection = { title: string; items: RailItem[] }

// A faint fade along the bottom while there's more to scroll. The first layer scrolls with the
// list and covers the fade once the end is reached.
const SCROLL_SHADOW =
  'linear-gradient(transparent, var(--popover) 70%) center bottom / 100% 40px no-repeat local, ' +
  'linear-gradient(to top, color-mix(in srgb, var(--foreground) 10%, transparent), transparent) center bottom / 100% 12px no-repeat scroll'

/**
 * The list beside a calendar: the ranges and seasons a reader can jump to. On phones it's one
 * dropdown, with section titles only when there's more than one section. The rail's height follows
 * the calendar when its parent is a grid, and the list scrolls inside it.
 */
export function SeasonRail({ label, sections }: { label: string; sections: RailSection[] }) {
  const items = sections.flatMap((section) => section.items)
  const select = (key: string) => items.find((item) => item.key === key)?.onSelect()
  const options = (section: RailSection) =>
    section.items.map((item) => (
      <option key={item.key} value={item.key}>
        {item.label}
      </option>
    ))

  return (
    <>
      <nav
        aria-label={label}
        style={{ background: SCROLL_SHADOW }}
        className="hidden flex-col gap-0.5 overflow-y-auto border-r p-2 sm:flex sm:h-0 sm:min-h-full"
      >
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-0.5">
            <span className="sticky -top-2 bg-popover px-3 py-1 text-xs text-muted-foreground">
              {section.title}
            </span>
            {section.items.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-current={item.active ? 'true' : undefined}
                onClick={item.onSelect}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-left text-sm hover:bg-muted',
                  item.active && 'bg-muted font-medium',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-b p-2 sm:hidden">
        <select
          aria-label={label}
          value={items.find((item) => item.active)?.key ?? ''}
          onChange={(event) => select(event.target.value)}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="" hidden>
            Choose
          </option>
          {sections.length > 1
            ? sections.map((section) => (
                <optgroup key={section.title} label={section.title}>
                  {options(section)}
                </optgroup>
              ))
            : sections.map(options)}
        </select>
      </div>
    </>
  )
}

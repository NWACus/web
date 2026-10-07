'use client'

/**
 * PROTOTYPE ONLY — the floating bar that flips between `?variant=` prototypes on a page.
 * Renders nothing in production builds so a stray merge can't ship it.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, type ReactNode } from 'react'

export interface PrototypeVariant {
  key: string
  label: string
}

interface PrototypeSwitcherProps {
  variants: PrototypeVariant[]
  current: string
  /** Extra knobs rendered at the right of the bar. */
  children?: ReactNode
}

export function usePrototypeParam() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (name: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString())
      if (value === null) next.delete(name)
      else next.set(name, value)
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  return { searchParams, setParam }
}

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function PrototypeSwitcher({ variants, current, children }: PrototypeSwitcherProps) {
  const index = Math.max(
    0,
    variants.findIndex((variant) => variant.key === current),
  )

  const step = useCallback(
    (delta: number) => {
      const next = variants[(index + delta + variants.length) % variants.length]
      if (!next) return
      // A full load per variant, so no variant inherits another's scripts or custom elements.
      const url = new URL(window.location.href)
      url.searchParams.set('variant', next.key)
      url.hash = ''
      window.location.assign(url.toString())
    },
    [index, variants],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step])

  if (process.env.NODE_ENV === 'production') return null

  const active = variants[index]

  return (
    <div className="fixed bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full bg-neutral-900 px-2 py-1.5 text-sm text-white shadow-2xl ring-2 ring-fuchsia-500">
      <button
        type="button"
        onClick={() => step(-1)}
        className="rounded-full p-1.5 hover:bg-neutral-700"
        aria-label="Previous variant"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[14rem] text-center font-medium">
        <span className="mr-1 text-fuchsia-400">
          {index + 1}/{variants.length}
        </span>
        {active?.label}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        className="rounded-full p-1.5 hover:bg-neutral-700"
        aria-label="Next variant"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {children && (
        <div className="flex items-center gap-3 border-l border-neutral-700 pl-3 pr-2">
          {children}
        </div>
      )}
    </div>
  )
}

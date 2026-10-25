import { useRef, type KeyboardEvent } from 'react'

/**
 * Arrow keys across a tablist's tabs, wrapping at the ends, as a tablist's do; `vertical` lets
 * Up and Down move too. Spread `onKeyDown` on the tablist and `ref={tabRef(i)}` on each tab.
 */
export function useTabListKeys(
  count: number,
  active: number,
  onPick: (index: number) => void,
  vertical = false,
) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: KeyboardEvent) {
    const back = event.key === 'ArrowLeft' || (vertical && event.key === 'ArrowUp')
    const forward = event.key === 'ArrowRight' || (vertical && event.key === 'ArrowDown')
    if (!back && !forward) return
    event.preventDefault()
    const next = (active + (forward ? 1 : -1) + count) % count
    onPick(next)
    tabs.current[next]?.focus()
  }

  const tabRef = (index: number) => (el: HTMLButtonElement | null) => {
    tabs.current[index] = el
  }

  return { onKeyDown, tabRef }
}

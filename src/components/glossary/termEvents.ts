import { TERM_ATTR } from './markGlossaryTerms'

export type ActiveTerm = {
  element: HTMLElement
  index: number
  /** A hover preview closes when the pointer leaves; a focus one when focus does; pinned stays. */
  via: 'hover' | 'focus' | 'pinned'
  /** Opened from the keyboard, so focus moves into the popover. */
  focusContent: boolean
}

/** What the delegated handlers need from the popover. */
export type TermControls = {
  active(): ActiveTerm | null
  open(element: HTMLElement, via: ActiveTerm['via'], focusContent?: boolean): void
  close(): void
  scheduleClose(): void
  /** Open a hover preview on another term, once the pointer has rested on it. */
  scheduleSwitch(element: HTMLElement): void
  cancelSwitch(): void
  /** Keep the current popover open: cancel any pending close or switch. */
  hold(): void
  contentContains(node: Node | null): boolean
}

/** Where the pointer or focus went; `Node.contains(null)` is false, so callers need no guard. */
function destination(event: PointerEvent | FocusEvent): Node | null {
  return event.relatedTarget instanceof Node ? event.relatedTarget : null
}

export function termFrom(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  const term = target.closest(`[${TERM_ATTR}]`)
  return term instanceof HTMLElement ? term : null
}

function isActive(controls: TermControls, term: HTMLElement, via?: ActiveTerm['via']): boolean {
  const active = controls.active()
  return active?.element === term && (!via || active.via === via)
}

function onPointerOver(event: PointerEvent, controls: TermControls) {
  const term = termFrom(event.target)
  if (!term) return
  if (isActive(controls, term)) return controls.hold()
  // A hover only replaces another hover, and only after a pause: it must not take a pinned popover,
  // or a keyboard user's focus preview, out from under them, nor switch on a term the pointer is
  // merely crossing on its way into the open popover.
  const current = controls.active()
  if (!current) controls.open(term, 'hover')
  else if (current.via === 'hover') controls.scheduleSwitch(term)
}

function onPointerOut(event: PointerEvent, controls: TermControls) {
  const term = termFrom(event.target)
  if (!term) return
  const next = destination(event)
  if (term.contains(next)) return
  controls.cancelSwitch()
  // Into the popover: its pointerenter holds it open. React's own document listener runs before
  // this one, so scheduling a close here would undo that hold.
  if (controls.contentContains(next)) return
  if (isActive(controls, term, 'hover')) controls.scheduleClose()
}

function onFocusIn(event: FocusEvent, controls: TermControls) {
  const term = termFrom(event.target)
  if (term && !isActive(controls, term)) controls.open(term, 'focus')
}

function onFocusOut(event: FocusEvent, controls: TermControls) {
  const term = termFrom(event.target)
  if (!term || !isActive(controls, term, 'focus')) return
  if (controls.contentContains(destination(event))) return
  controls.close()
}

// Tapping, clicking or pressing Enter pins the popover open and never navigates; a second
// activation closes it.
function toggle(controls: TermControls, term: HTMLElement, focusContent: boolean) {
  if (isActive(controls, term, 'pinned')) controls.close()
  else controls.open(term, 'pinned', focusContent)
}

function onClick(event: MouseEvent, controls: TermControls) {
  const term = termFrom(event.target)
  if (!term) return
  event.preventDefault()
  toggle(controls, term, false)
}

function onKeyDown(event: KeyboardEvent, controls: TermControls) {
  const term = termFrom(event.target)
  if (!term || event.repeat) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle(controls, term, true)
  } else if (event.key === 'Escape') {
    controls.close()
  }
}

/**
 * Terms are plain DOM inside authored HTML, so their events are delegated from the document.
 * Hover is mouse-only: a touch fires pointerover too, and a tap is handled as a click instead.
 * Returns the cleanup.
 */
export function listenForTermEvents(target: Document, controls: TermControls): () => void {
  const pointerOver = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') onPointerOver(event, controls)
  }
  const pointerOut = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') onPointerOut(event, controls)
  }
  const focusIn = (event: FocusEvent) => onFocusIn(event, controls)
  const focusOut = (event: FocusEvent) => onFocusOut(event, controls)
  const click = (event: MouseEvent) => onClick(event, controls)
  const keyDown = (event: KeyboardEvent) => onKeyDown(event, controls)

  target.addEventListener('pointerover', pointerOver)
  target.addEventListener('pointerout', pointerOut)
  target.addEventListener('focusin', focusIn)
  target.addEventListener('focusout', focusOut)
  target.addEventListener('click', click)
  target.addEventListener('keydown', keyDown)
  return () => {
    target.removeEventListener('pointerover', pointerOver)
    target.removeEventListener('pointerout', pointerOut)
    target.removeEventListener('focusin', focusIn)
    target.removeEventListener('focusout', focusOut)
    target.removeEventListener('click', click)
    target.removeEventListener('keydown', keyDown)
  }
}

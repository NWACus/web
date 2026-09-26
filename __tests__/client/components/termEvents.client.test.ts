import { TERM_ATTR } from '@/components/glossary/markGlossaryTerms'
import {
  listenForTermEvents,
  type ActiveTerm,
  type TermControls,
} from '@/components/glossary/termEvents'

// The handlers on their own, with no React: in the app React's listener shares the document and
// runs first, which a component test (React rooted on a container div) never reproduces.

function setup(active: ActiveTerm['via'] | null) {
  document.body.innerHTML = `<p><span ${TERM_ATTR}="0">slab</span> and <span ${TERM_ATTR}="1">cornice</span></p><div id="popover"><a href="#">Learn more</a></div>`
  const [slab, cornice] = [...document.querySelectorAll<HTMLElement>(`[${TERM_ATTR}]`)]
  const popover = document.getElementById('popover')
  const controls = {
    active: () => (active ? { element: slab, index: 0, via: active, focusContent: false } : null),
    open: jest.fn(),
    close: jest.fn(),
    scheduleClose: jest.fn(),
    scheduleSwitch: jest.fn(),
    cancelSwitch: jest.fn(),
    hold: jest.fn(),
    contentContains: (node: Node | null) => popover?.contains(node) ?? false,
  } satisfies TermControls
  const stop = listenForTermEvents(document, controls)
  return { slab, cornice, popover, controls, stop }
}

function mouse(type: 'pointerover' | 'pointerout', target: Element, relatedTarget: Element | null) {
  const event = new MouseEvent(type, { bubbles: true, relatedTarget })
  Object.defineProperty(event, 'pointerType', { value: 'mouse' })
  target.dispatchEvent(event)
}

describe('glossary term events', () => {
  it('does not schedule a close when the pointer moves from the term into its popover', () => {
    const { slab, popover, controls, stop } = setup('hover')
    mouse('pointerout', slab, popover?.querySelector('a') ?? null)
    expect(controls.scheduleClose).not.toHaveBeenCalled()
    stop()
  })

  it('schedules a close when the pointer leaves the term for plain text', () => {
    const { slab, controls, stop } = setup('hover')
    mouse('pointerout', slab, document.querySelector('p'))
    expect(controls.scheduleClose).toHaveBeenCalledTimes(1)
    stop()
  })

  it('waits before switching a hover preview to a term the pointer crosses', () => {
    const { slab, cornice, controls, stop } = setup('hover')
    mouse('pointerover', cornice, slab)
    expect(controls.open).not.toHaveBeenCalled()
    expect(controls.scheduleSwitch).toHaveBeenCalledWith(cornice)

    mouse('pointerout', cornice, document.querySelector('p'))
    expect(controls.cancelSwitch).toHaveBeenCalled()
    stop()
  })

  it('opens at once when nothing is open, as the widget did', () => {
    const { cornice, controls, stop } = setup(null)
    mouse('pointerover', cornice, null)
    expect(controls.open).toHaveBeenCalledWith(cornice, 'hover')
    stop()
  })
})

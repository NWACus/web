import { DesktopNav } from '@/components/Header/DesktopNav.client'
import { TopLevelNavItem } from '@/components/Header/utils'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ capture: jest.fn() }),
}))

const navItems: TopLevelNavItem[] = [
  {
    label: 'Observations',
    items: [
      {
        id: 'submit',
        link: { type: 'internal', label: 'Submit an observation', url: '/observations/submit' },
      },
    ],
  },
  {
    displayMode: 'button',
    link: { type: 'internal', label: 'Donate', url: '/donate' },
  },
]

// jsdom has no PointerEvent, so attach pointerType to plain events like a browser would.
function withPointerType<T extends Event>(event: T, pointerType: string) {
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  return event
}

// iOS Safari reports a tap's click as pointerType 'mouse', so the click type defaults to mouse.
function tapWith(element: HTMLElement, pointerType: string, clickPointerType = 'mouse') {
  fireEvent(element, withPointerType(new MouseEvent('pointerdown', { bubbles: true }), pointerType))
  const click = withPointerType(
    new MouseEvent('click', { bubbles: true, cancelable: true }),
    clickPointerType,
  )
  fireEvent(element, click)
  return click
}

function pressKey(element: HTMLElement) {
  const click = withPointerType(new MouseEvent('click', { bubbles: true, cancelable: true }), '')
  fireEvent(element, click)
  return click
}

describe('DesktopNav', () => {
  it('opens a dropdown when its trigger is tapped', () => {
    render(<DesktopNav topLevelNavItems={navItems} />)
    const trigger = screen.getByRole('button', { name: 'Observations' })

    const event = tapWith(trigger, 'touch')

    expect(event.defaultPrevented).toBe(false)
    expect(trigger).toHaveAttribute('data-state', 'open')
    expect(screen.getByRole('link', { name: 'Submit an observation' })).toHaveAttribute(
      'href',
      '/observations/submit',
    )

    tapWith(trigger, 'touch')
    expect(trigger).toHaveAttribute('data-state', 'closed')
  })

  it('opens a dropdown when its trigger is tapped with a pen', () => {
    render(<DesktopNav topLevelNavItems={navItems} />)
    const trigger = screen.getByRole('button', { name: 'Observations' })

    tapWith(trigger, 'pen')

    expect(trigger).toHaveAttribute('data-state', 'open')
  })

  // Hover opens the menu for a mouse, so a click must not toggle it closed again.
  it('ignores a mouse click on the trigger', () => {
    render(<DesktopNav topLevelNavItems={navItems} />)
    const trigger = screen.getByRole('button', { name: 'Observations' })

    const event = tapWith(trigger, 'mouse')

    expect(event.defaultPrevented).toBe(true)
    expect(trigger).toHaveAttribute('data-state', 'closed')
  })

  it('toggles the dropdown from the keyboard', () => {
    render(<DesktopNav topLevelNavItems={navItems} />)
    const trigger = screen.getByRole('button', { name: 'Observations' })

    pressKey(trigger)
    expect(trigger).toHaveAttribute('data-state', 'open')

    pressKey(trigger)
    expect(trigger).toHaveAttribute('data-state', 'closed')
  })
})

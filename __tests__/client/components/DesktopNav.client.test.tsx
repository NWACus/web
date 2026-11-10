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

// jsdom's click is a MouseEvent with no pointerType, so attach one like a browser's PointerEvent.
function clickWith(element: HTMLElement, pointerType: string) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  fireEvent(element, event)
  return event
}

describe('DesktopNav', () => {
  it('opens a dropdown when its trigger is tapped', () => {
    render(<DesktopNav topLevelNavItems={navItems} />)
    const trigger = screen.getByRole('button', { name: 'Observations' })

    const event = clickWith(trigger, 'touch')

    expect(event.defaultPrevented).toBe(false)
    expect(trigger).toHaveAttribute('data-state', 'open')
    expect(screen.getByRole('link', { name: 'Submit an observation' })).toHaveAttribute(
      'href',
      '/observations/submit',
    )

    clickWith(trigger, 'touch')
    expect(trigger).toHaveAttribute('data-state', 'closed')
  })

  it('opens a dropdown when its trigger is tapped with a pen', () => {
    render(<DesktopNav topLevelNavItems={navItems} />)
    const trigger = screen.getByRole('button', { name: 'Observations' })

    clickWith(trigger, 'pen')

    expect(trigger).toHaveAttribute('data-state', 'open')
  })

  // Hover opens the menu for a mouse, so a click must not toggle it closed again.
  it('ignores a mouse click on the trigger', () => {
    render(<DesktopNav topLevelNavItems={navItems} />)
    const trigger = screen.getByRole('button', { name: 'Observations' })

    const event = clickWith(trigger, 'mouse')

    expect(event.defaultPrevented).toBe(true)
    expect(trigger).toHaveAttribute('data-state', 'closed')
  })

  it('toggles the dropdown from the keyboard', () => {
    render(<DesktopNav topLevelNavItems={navItems} />)
    const trigger = screen.getByRole('button', { name: 'Observations' })

    clickWith(trigger, '')
    expect(trigger).toHaveAttribute('data-state', 'open')

    clickWith(trigger, '')
    expect(trigger).toHaveAttribute('data-state', 'closed')
  })
})

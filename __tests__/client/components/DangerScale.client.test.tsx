import { DangerScale } from '@/components/forecast/DangerScale'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

describe('DangerScale', () => {
  // A one-item accordion has nowhere to move focus, so these keys must still scroll the page.
  it.each(['ArrowDown', 'ArrowUp', 'Home', 'End'])('leaves %s to the page', (key) => {
    render(<DangerScale />)
    const trigger = screen.getByRole('button', { name: /Avalanche Danger Scale/ })

    // fireEvent returns false when a handler called preventDefault.
    expect(fireEvent.keyDown(trigger, { key })).toBe(true)
  })
})

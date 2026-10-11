import { InfoPopover } from '@/components/forecast/InfoPopover'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const HELP = '<p><strong>Avalanche Danger</strong> is a tool.</p>'

describe('InfoPopover', () => {
  // The trigger is a native button, so Enter and Space reach it as a click. The e2e spec presses
  // them, and checks focus comes back to the trigger, which jsdom does not settle synchronously.
  it('opens on click and closes on Escape', () => {
    render(<InfoPopover html={HELP} label="About Avalanche Danger" />)
    const trigger = screen.getByRole('button', { name: 'About Avalanche Danger' })

    fireEvent.click(trigger)
    const panel = screen.getByText(/is a tool/)
    expect(panel).toBeInTheDocument()

    fireEvent.keyDown(panel, { key: 'Escape' })
    expect(screen.queryByText(/is a tool/)).not.toBeInTheDocument()
  })

  it('keeps the ⓘ off paper', () => {
    render(<InfoPopover html={HELP} label="About Avalanche Danger" />)

    expect(screen.getByRole('button', { name: 'About Avalanche Danger' })).toHaveClass(
      'print:hidden',
    )
  })

  it('opens the ⓘ on hover', () => {
    render(<InfoPopover html={HELP} label="About Avalanche Danger" />)

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'About Avalanche Danger' }))

    expect(screen.getByText(/is a tool/)).toBeInTheDocument()
  })

  // A custom trigger shows its hint on hover instead, so hovering must not also open the panel.
  it('opens a custom trigger on click only, and lets it print', () => {
    render(
      <InfoPopover html={HELP} label="What it means" hint="Click to learn more">
        <span>icon</span>
      </InfoPopover>,
    )
    const trigger = screen.getByRole('button', { name: 'What it means' })

    fireEvent.mouseEnter(trigger)
    expect(screen.queryByText(/is a tool/)).not.toBeInTheDocument()
    expect(trigger).not.toHaveClass('print:hidden')

    fireEvent.click(trigger)
    expect(screen.getByText(/is a tool/)).toBeInTheDocument()
  })
})

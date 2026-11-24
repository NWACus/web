import * as lists from '@/views/Analytics/lists'
import { ListPanel, listTab } from '@/views/Analytics/panels/ListPanel'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

// Renders the popup's content inline, so its definitions can be read without opening it
jest.mock('@payloadcms/ui', () => ({
  Popup: ({ button, render }: { button: ReactNode; render?: () => ReactNode }) => (
    <div>
      {button}
      {render?.()}
    </div>
  ),
  PopupList: { ButtonGroup: () => null, Button: () => null },
  Button: () => null,
  ShimmerEffect: () => null,
}))

jest.mock('../../src/views/Analytics/useReport', () => ({
  parseRows: () => () => ({ rows: [] }),
  useReport: () => ({ status: 'loading' }),
}))

const request = { center: 'nwac', from: '2026-11-16', to: '2026-11-23', generation: 0 }

describe('list definitions', () => {
  it('defines every traffic breakdown', () => {
    const breakdowns = [
      lists.TOP_PAGES,
      lists.ENTRY_PAGES,
      lists.EXIT_PAGES,
      lists.REFERRERS,
      lists.CHANNELS,
      lists.CITIES,
      lists.REGIONS,
      lists.COUNTRIES,
      lists.DEVICE_TYPES,
      lists.BROWSERS,
      lists.OPERATING_SYSTEMS,
    ]
    for (const spec of breakdowns) expect(spec.about?.text).toBeTruthy()
  })

  it("shows the active tab's definition and PostHog link beside the card title", () => {
    render(<ListPanel title="Pages" tabs={[listTab(lists.EXIT_PAGES)]} request={request} />)

    expect(screen.getByText('About Exit pages')).toBeInTheDocument()
    expect(screen.getByText(/The last page of each visit/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'PostHog: paths' })).toHaveAttribute(
      'href',
      'https://posthog.com/docs/web-analytics/dashboard#paths',
    )
  })

  it('shows no ⓘ for a list without a definition', () => {
    render(<ListPanel title="Sponsors" tabs={[listTab(lists.SPONSORS)]} request={request} />)
    expect(screen.queryByText(/^About /)).not.toBeInTheDocument()
  })
})

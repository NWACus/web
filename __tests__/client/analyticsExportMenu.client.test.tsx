import { ExportMenu } from '@/views/Analytics/panels/ExportMenu'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

jest.mock('@payloadcms/ui', () => ({
  Popup: ({ button }: { button: ReactNode }) => <div data-testid="popup">{button}</div>,
  PopupList: { ButtonGroup: () => null, Button: () => null },
}))

describe('ExportMenu', () => {
  it('renders nothing without items', () => {
    const { container } = render(<ExportMenu name="Top pages" items={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('downloads directly when there is one format', () => {
    const onSelect = jest.fn()
    render(<ExportMenu name="Top pages" items={[{ label: 'CSV data', onSelect }]} />)

    expect(screen.queryByTestId('popup')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Download Top pages (CSV data)' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('opens a menu when there are several formats', () => {
    render(
      <ExportMenu
        name="trend and summary"
        items={[
          { label: 'Chart image', onSelect: jest.fn() },
          { label: 'CSV data', onSelect: jest.fn() },
        ]}
      />,
    )

    expect(screen.getByTestId('popup')).toHaveTextContent('Download trend and summary')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

import { DateRangeField } from '@/blocks/ObservationsWidget/DateRangeField'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const mockSetValue = jest.fn()
const mockGetFirstObservationSeason = jest.fn()
let mockValue: string | undefined = 'past2Weeks'

jest.mock('@payloadcms/ui', () => ({
  useField: () => ({ value: mockValue, setValue: mockSetValue, showError: false }),
  // A native select stands in for Payload's react-select
  SelectInput: ({
    label,
    description,
    options,
    value,
    onChange,
  }: {
    label: string
    description?: string
    options: { value: string; label: string }[]
    value: string
    onChange: (option: { value: string } | null) => void
  }) => (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange({ value: event.target.value })}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p>{description}</p>
    </label>
  ),
}))

// next/jest rewrites `@/` only in import statements, so the mocks need relative paths.
jest.mock('../../../src/providers/TenantSelectionProvider/index.client', () => ({
  useTenantSelection: () => ({ selectedTenantSlug: 'snfac' }),
}))

jest.mock('../../../src/blocks/ObservationsWidget/getFirstObservationSeason', () => ({
  getFirstObservationSeason: (center: string) => mockGetFirstObservationSeason(center),
}))

const renderField = () =>
  render(
    <DateRangeField
      path="dateRange"
      field={{
        name: 'dateRange',
        type: 'text',
        label: 'Date Range',
        admin: { description: 'Ranges count back from today.' },
      }}
    />,
  )

describe('DateRangeField', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 0, 15), advanceTimers: true })
    mockValue = 'past2Weeks'
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it("lists the center's past seasons once they load", async () => {
    mockGetFirstObservationSeason.mockResolvedValue(2024)
    renderField()

    expect(screen.getByText('Loading past seasons…')).toBeInTheDocument()
    expect(await screen.findByRole('option', { name: '24/25 Season' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '23/24 Season' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '22/23 Season' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'This Season (25/26)' })).toBeInTheDocument()
    expect(screen.getByText('Ranges count back from today.')).toBeInTheDocument()
    expect(mockGetFirstObservationSeason).toHaveBeenCalledWith('snfac')
  })

  it('saves the picked season', async () => {
    mockGetFirstObservationSeason.mockResolvedValue(2024)
    renderField()
    await screen.findByRole('option', { name: '24/25 Season' })

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2024-25' } })

    expect(mockSetValue).toHaveBeenCalledWith('2024-25')
  })

  it('keeps the presets and a saved season when avalanche.org fails', async () => {
    mockValue = '2023-24'
    mockGetFirstObservationSeason.mockRejectedValue(new Error('down'))
    renderField()

    expect(
      await screen.findByText(
        'Could not load past seasons from avalanche.org. A saved season is kept.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('2023-24')
    expect(screen.getByRole('option', { name: '23/24 Season' })).toBeInTheDocument()
  })
})

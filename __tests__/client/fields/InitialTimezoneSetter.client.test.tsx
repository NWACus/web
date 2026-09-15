import {
  defaultTimezoneFor,
  InitialTimezoneSetter,
} from '@/fields/startAndEndDateField/components/InitialTimezoneSetter'
import { US_TIMEZONES } from '@/utilities/timezones'
import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'

const mockUseField = jest.fn()
const mockUseTenantSelection = jest.fn()
const mockGetBrowserTimezone = jest.fn()

jest.mock('@payloadcms/ui', () => ({
  useField: (...args: unknown[]) => mockUseField(...args),
}))

// next/jest rewrites `@/` only in import statements, so the mock needs the relative path.
jest.mock('../../../src/providers/TenantSelectionProvider/index.client', () => ({
  useTenantSelection: () => mockUseTenantSelection(),
}))

jest.mock('../../../src/utilities/getBrowserTimezone', () => ({
  getBrowserTimezone: () => mockGetBrowserTimezone(),
}))

type TimezonePath = 'startDate' | 'startDate_tz' | 'endDate_tz' | 'registrationDeadline_tz'

function stubBrowserTimezone(timeZone: string) {
  mockGetBrowserTimezone.mockReturnValue(timeZone)
}

function stubFields(values: Partial<Record<TimezonePath, string>>) {
  const setters: Record<TimezonePath, jest.Mock> = {
    startDate: jest.fn(),
    startDate_tz: jest.fn(),
    endDate_tz: jest.fn(),
    registrationDeadline_tz: jest.fn(),
  }
  mockUseField.mockImplementation(({ path }: { path: TimezonePath }) => ({
    value: values[path],
    setValue: setters[path],
  }))
  return setters
}

function renderSetter({ defaultToCenterTimezone = true } = {}) {
  return render(
    <InitialTimezoneSetter
      path="initialTimezoneSetter"
      field={{ name: 'initialTimezoneSetter', admin: {} }}
      defaultToCenterTimezone={defaultToCenterTimezone}
    />,
  )
}

describe('InitialTimezoneSetter', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockUseField.mockReset()
    mockUseTenantSelection.mockReset()
    mockUseTenantSelection.mockReturnValue({ selectedTenantSlug: undefined })
    mockGetBrowserTimezone.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('defaults a new document to the selected center timezone, not the browser', () => {
    stubBrowserTimezone(US_TIMEZONES.MOUNTAIN)
    mockUseTenantSelection.mockReturnValue({ selectedTenantSlug: 'nwac' })
    const setters = stubFields({})

    renderSetter()
    act(() => {
      jest.runAllTimers()
    })

    expect(setters.startDate_tz).toHaveBeenCalledWith(US_TIMEZONES.PACIFIC)
  })

  it('ignores the selected center when the collection is not tenant-scoped', () => {
    stubBrowserTimezone(US_TIMEZONES.MOUNTAIN)
    mockUseTenantSelection.mockReturnValue({ selectedTenantSlug: 'nwac' })
    const setters = stubFields({})

    renderSetter({ defaultToCenterTimezone: false })
    act(() => {
      jest.runAllTimers()
    })

    expect(setters.startDate_tz).toHaveBeenCalledWith(US_TIMEZONES.MOUNTAIN)
  })

  it('falls back to the browser timezone when no tenant is selected', () => {
    stubBrowserTimezone(US_TIMEZONES.MOUNTAIN)
    const setters = stubFields({})

    renderSetter()
    act(() => {
      jest.runAllTimers()
    })

    expect(setters.startDate_tz).toHaveBeenCalledWith(US_TIMEZONES.MOUNTAIN)
  })

  it('leaves an already-set timezone alone', () => {
    stubBrowserTimezone(US_TIMEZONES.MOUNTAIN)
    mockUseTenantSelection.mockReturnValue({ selectedTenantSlug: 'nwac' })
    const setters = stubFields({
      startDate_tz: US_TIMEZONES.ALASKA,
      endDate_tz: US_TIMEZONES.ALASKA,
    })

    renderSetter()
    act(() => {
      jest.runAllTimers()
    })

    expect(setters.startDate_tz).not.toHaveBeenCalled()
  })

  it('tells the editor when the chosen timezone differs from their browser', () => {
    stubBrowserTimezone(US_TIMEZONES.MOUNTAIN)
    stubFields({ startDate_tz: US_TIMEZONES.PACIFIC, endDate_tz: US_TIMEZONES.PACIFIC })

    renderSetter()
    act(() => {
      jest.runAllTimers()
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Times are in Pacific Time (PT). Your browser is in Mountain Time (MT).',
    )
  })

  it('renders nothing when the timezones match', () => {
    stubBrowserTimezone(US_TIMEZONES.PACIFIC)
    stubFields({ startDate_tz: US_TIMEZONES.PACIFIC, endDate_tz: US_TIMEZONES.PACIFIC })

    const { container } = renderSetter()
    act(() => {
      jest.runAllTimers()
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('stays quiet when the browser zone is another name for the same offset', () => {
    stubBrowserTimezone('America/Boise')
    stubFields({ startDate_tz: US_TIMEZONES.MOUNTAIN, endDate_tz: US_TIMEZONES.MOUNTAIN })

    const { container } = renderSetter()
    act(() => {
      jest.runAllTimers()
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('warns an Arizona browser about a summer Mountain event but not a winter one', () => {
    stubBrowserTimezone(US_TIMEZONES.ARIZONA)
    stubFields({
      startDate: '2026-07-15T12:00:00.000Z',
      startDate_tz: US_TIMEZONES.MOUNTAIN,
      endDate_tz: US_TIMEZONES.MOUNTAIN,
    })

    const summer = renderSetter()
    act(() => {
      jest.runAllTimers()
    })
    expect(screen.getByRole('status')).toBeInTheDocument()
    summer.unmount()

    stubFields({
      startDate: '2026-01-15T12:00:00.000Z',
      startDate_tz: US_TIMEZONES.MOUNTAIN,
      endDate_tz: US_TIMEZONES.MOUNTAIN,
    })

    const { container } = renderSetter()
    act(() => {
      jest.runAllTimers()
    })
    expect(container).toBeEmptyDOMElement()
  })
})

describe('defaultTimezoneFor', () => {
  it('uses the center timezone for a valid tenant slug', () => {
    expect(defaultTimezoneFor('kpac', US_TIMEZONES.PACIFIC)).toBe(US_TIMEZONES.ARIZONA)
  })

  it('uses a supported browser timezone when there is no tenant', () => {
    expect(defaultTimezoneFor(undefined, US_TIMEZONES.EASTERN)).toBe(US_TIMEZONES.EASTERN)
  })

  it('returns undefined for an unsupported browser timezone with no tenant', () => {
    expect(defaultTimezoneFor(undefined, 'Europe/Paris')).toBeUndefined()
  })
})

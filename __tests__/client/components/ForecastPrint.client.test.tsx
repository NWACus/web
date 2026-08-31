import { ForecastPrint } from '@/components/forecast/ForecastPrint.client'
import type { PrintSection } from '@/components/forecast/forecastPrintSections'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const captureWithTenant = jest.fn()
jest.mock('../../../src/utilities/useAnalytics', () => ({
  useAnalytics: () => ({ captureWithTenant }),
}))

const ALL_SECTIONS: PrintSection[] = ['bottomLine', 'problems', 'discussion', 'weather']

function renderPrint(availableSections: PrintSection[] = ALL_SECTIONS) {
  return render(
    <ForecastPrint
      availableSections={availableSections}
      filename="nwac-olympics-avalanche-forecast-2026-04-20"
      centerName="Northwest Avalanche Center"
      centerUrl="https://nwac.us/"
    />,
  )
}

/** Open the section modal the way a reader does. */
function openModal() {
  fireEvent.click(screen.getByRole('button', { name: 'Print this forecast' }))
}

/** Radix renders each checkbox as a button, so drive it by its label's `for` target. */
function toggleSection(label: string) {
  fireEvent.click(screen.getByLabelText(label))
}

function clickButton(name: string) {
  fireEvent.click(screen.getByRole('button', { name }))
}

describe('ForecastPrint', () => {
  let print: jest.Mock

  beforeEach(() => {
    captureWithTenant.mockClear()
    print = jest.fn()
    window.print = print
    document.title = 'Olympics | NWAC'
    delete document.documentElement.dataset.printSections
  })

  it('offers a checkbox only for the sections the product has content for', () => {
    renderPrint(['bottomLine', 'discussion'])
    openModal()

    expect(screen.getByLabelText('Bottom Line & Danger (Recommended)')).toBeInTheDocument()
    expect(screen.getByLabelText('Forecast Discussion')).toBeInTheDocument()
    // The legacy modal showed these regardless; a center with no weather product got a dead box.
    expect(screen.queryByLabelText('Mountain Weather')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Avalanche Problems')).not.toBeInTheDocument()
  })

  it('starts with the legacy widget defaults — everything but the discussion', () => {
    renderPrint()
    openModal()

    expect(screen.getByLabelText('Bottom Line & Danger (Recommended)')).toBeChecked()
    expect(screen.getByLabelText('Avalanche Problems')).toBeChecked()
    expect(screen.getByLabelText('Mountain Weather')).toBeChecked()
    expect(screen.getByLabelText('Forecast Discussion')).not.toBeChecked()
  })

  it('records the reader’s selection for the print stylesheet, then prints', () => {
    renderPrint()
    openModal()

    toggleSection('Avalanche Problems')
    clickButton('Print')

    // Canonical order regardless of the order boxes were clicked, so the attribute is predictable.
    expect(document.documentElement.dataset.printSections).toBe('bottomLine weather')
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('includes a newly checked section', () => {
    renderPrint()
    openModal()

    toggleSection('Forecast Discussion')
    clickButton('Print')

    expect(document.documentElement.dataset.printSections).toBe(
      'bottomLine problems discussion weather',
    )
  })

  it('renames the document so the browser offers a meaningful PDF filename', () => {
    renderPrint()
    openModal()
    clickButton('Print')

    expect(document.title).toBe('nwac-olympics-avalanche-forecast-2026-04-20')
  })

  it('restores the page title and clears the section marker once printing ends', () => {
    renderPrint()
    openModal()
    clickButton('Print')

    window.dispatchEvent(new Event('afterprint'))

    expect(document.title).toBe('Olympics | NWAC')
    expect(document.documentElement.dataset.printSections).toBeUndefined()
  })

  it('does not print when the reader cancels', () => {
    renderPrint()
    openModal()
    clickButton('Cancel')

    expect(print).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.printSections).toBeUndefined()
  })

  it('refuses to print an empty page when every section is unchecked', () => {
    renderPrint(['bottomLine'])
    openModal()

    toggleSection('Bottom Line & Danger (Recommended)')

    expect(screen.getByRole('button', { name: 'Print' })).toBeDisabled()
  })

  it('renders nothing for a product with no printable sections', () => {
    const { container } = renderPrint([])
    expect(container).toBeEmptyDOMElement()
  })

  it('reports the print and which sections went with it', () => {
    renderPrint()
    openModal()
    clickButton('Print')

    expect(captureWithTenant).toHaveBeenCalledWith('forecast_print', {
      sections: 'bottomLine,problems,weather',
    })
  })
})

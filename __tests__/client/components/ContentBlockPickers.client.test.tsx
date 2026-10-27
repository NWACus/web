import { ColorPicker } from '@/components/ColorPicker'
import { ColumnLayoutPicker } from '@/components/ColumnLayoutPicker'
import { VerticalAlignmentPicker } from '@/components/VerticalAlignmentPicker'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import type { SelectFieldClientProps, TextFieldClientProps } from 'payload'

const mockSetValue = jest.fn()
const mockFieldValues: Record<string, unknown> = {}

jest.mock('@payloadcms/ui', () => ({
  useField: ({ path }: { path: string }) => ({
    value: mockFieldValues[path],
    setValue: mockSetValue,
    showError: false,
    errorMessage: undefined,
  }),
  useDocumentInfo: () => ({ data: { tenant: 1 } }),
  FieldLabel: ({ label }: { label: string }) => <span>{label}</span>,
}))

jest.mock('@payloadcms/ui/shared', () => ({
  mergeFieldStyles: () => ({}),
}))

jest.mock('../../../src/utilities/getSlugFromTenantId', () => ({
  getSlugFromTenantId: async () => 'nwac',
}))

const layoutProps: SelectFieldClientProps = {
  path: 'layout.0.layout',
  field: { name: 'layout', label: 'Column layout', type: 'select', options: [], required: true },
}

const alignmentProps: SelectFieldClientProps = {
  path: 'layout.0.verticalAlignment',
  field: {
    name: 'verticalAlignment',
    label: 'Vertical alignment',
    type: 'select',
    options: [],
    required: true,
  },
}

const colorProps: TextFieldClientProps = {
  path: 'layout.0.backgroundColor',
  field: { name: 'backgroundColor', label: 'Background color', type: 'text', required: true },
}

beforeEach(() => {
  mockSetValue.mockClear()
  for (const key of Object.keys(mockFieldValues)) delete mockFieldValues[key]
})

describe('ColumnLayoutPicker', () => {
  it('labels each layout by its desktop widths', () => {
    mockFieldValues['layout.0.columns'] = 2
    mockFieldValues['layout.0.layout'] = '2_11'
    render(<ColumnLayoutPicker {...layoutProps} />)

    expect(screen.getAllByRole('radio').map((el) => el.textContent)).toEqual(['1:1', '2:1', '1:2'])
  })

  it('stores the legacy value for the chosen layout', () => {
    mockFieldValues['layout.0.columns'] = 2
    mockFieldValues['layout.0.layout'] = '2_11'
    render(<ColumnLayoutPicker {...layoutProps} />)

    fireEvent.click(screen.getByRole('radio', { name: '2:1 column widths' }))
    expect(mockSetValue).toHaveBeenCalledWith('2_12')
  })

  it('renders nothing for a single column', () => {
    mockFieldValues['layout.0.columns'] = 1
    mockFieldValues['layout.0.layout'] = '1_1'
    const { container } = render(<ColumnLayoutPicker {...layoutProps} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('VerticalAlignmentPicker', () => {
  it('sets the chosen alignment', () => {
    mockFieldValues['layout.0.columns'] = 2
    mockFieldValues['layout.0.verticalAlignment'] = 'top'
    render(<VerticalAlignmentPicker {...alignmentProps} />)

    expect(screen.getByRole('radio', { name: 'Align top' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Align middle' }))
    expect(mockSetValue).toHaveBeenCalledWith('center')
  })

  it('renders nothing for a single column', () => {
    mockFieldValues['layout.0.columns'] = 1
    const { container } = render(<VerticalAlignmentPicker {...alignmentProps} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('ColorPicker', () => {
  it('shows the current color and picks a new one from the dropdown', async () => {
    mockFieldValues['layout.0.backgroundColor'] = 'brand-300'
    render(<ColorPicker {...colorProps} />)

    const trigger = screen.getByRole('button', { name: /Brand 300/ })
    fireEvent.click(trigger)

    const option = await screen.findByRole('radio', { name: 'Brand 500' })
    expect(screen.getByRole('radio', { name: 'Brand 300' })).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(option)
    expect(mockSetValue).toHaveBeenCalledWith('brand-500')
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    render(<ColorPicker {...colorProps} />)

    fireEvent.click(screen.getByRole('button', { name: /Transparent/ }))
    await screen.findByRole('radiogroup')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })
})

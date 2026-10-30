import { ColorPicker } from '@/components/ColorPicker'
import { ColumnLayoutPicker } from '@/components/ColumnLayoutPicker'
import { LayoutSummaryLabel } from '@/components/LayoutSummaryLabel'
import { VerticalAlignmentPicker } from '@/components/VerticalAlignmentPicker'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ClientField, SelectFieldClientProps, TextFieldClientProps } from 'payload'

const mockSetValue = jest.fn()
const mockFieldValues = new Map<string, unknown>()

jest.mock('@payloadcms/ui', () => ({
  useField: ({ path }: { path: string }) => ({
    value: mockFieldValues.get(path),
    setValue: mockSetValue,
    showError: false,
    errorMessage: undefined,
  }),
  useFormFields: <T,>(selector: (context: [Record<string, { value: unknown }>]) => T) =>
    selector([Object.fromEntries([...mockFieldValues].map(([path, value]) => [path, { value }]))]),
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
  mockFieldValues.clear()
})

describe('ColumnLayoutPicker', () => {
  it('labels each layout by its desktop widths', () => {
    mockFieldValues.set('layout.0.columns', 2)
    mockFieldValues.set('layout.0.layout', '2_11')
    render(<ColumnLayoutPicker {...layoutProps} />)

    expect(screen.getAllByRole('radio').map((el) => el.textContent)).toEqual(['1:1', '2:1', '1:2'])
  })

  it('stores the value whose digits match the chosen widths', () => {
    mockFieldValues.set('layout.0.columns', 2)
    mockFieldValues.set('layout.0.layout', '2_11')
    render(<ColumnLayoutPicker {...layoutProps} />)

    fireEvent.click(screen.getByRole('radio', { name: '2:1 column widths' }))
    expect(mockSetValue).toHaveBeenCalledWith('2_21')
  })

  it('renders nothing for a single column', () => {
    mockFieldValues.set('layout.0.columns', 1)
    mockFieldValues.set('layout.0.layout', '1_1')
    const { container } = render(<ColumnLayoutPicker {...layoutProps} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('VerticalAlignmentPicker', () => {
  it('sets the chosen alignment', () => {
    mockFieldValues.set('layout.0.columns', 2)
    mockFieldValues.set('layout.0.verticalAlignment', 'top')
    render(<VerticalAlignmentPicker {...alignmentProps} />)

    expect(screen.getByRole('radio', { name: 'Align top' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: 'Align middle' }))
    expect(mockSetValue).toHaveBeenCalledWith('center')
  })

  it('renders nothing for a single column', () => {
    mockFieldValues.set('layout.0.columns', 1)
    const { container } = render(<VerticalAlignmentPicker {...alignmentProps} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('ColorPicker', () => {
  it('shows the current color and picks a new one from the dropdown', async () => {
    mockFieldValues.set('layout.0.backgroundColor', 'brand-300')
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

describe('LayoutSummaryLabel', () => {
  const spacingOptions = [
    { label: 'None', value: 'none' },
    { label: 'Small', value: 'sm' },
    { label: 'Large', value: 'lg' },
  ]
  const spacingRow: ClientField = {
    type: 'row',
    fields: [
      { name: 'spacingTop', type: 'select', options: spacingOptions },
      { name: 'spacingBottom', type: 'select', options: spacingOptions },
    ],
  }
  const contentFields: ClientField[] = [
    {
      type: 'row',
      fields: [
        { name: 'backgroundColor', type: 'text' },
        {
          name: 'layout',
          type: 'select',
          options: [
            { label: 'full', value: '1_1' },
            { label: '2:1', value: '2_21' },
          ],
        },
        {
          name: 'verticalAlignment',
          type: 'select',
          options: [
            { label: 'Top', value: 'top' },
            { label: 'Middle', value: 'center' },
          ],
        },
      ],
    },
    spacingRow,
  ]
  const imageTextFields: ClientField[] = [
    { name: 'backgroundColor', type: 'text' },
    {
      name: 'imageLayout',
      type: 'radio',
      options: [
        { label: 'Image left, text right', value: 'left' },
        { label: 'Text left, Image right', value: 'right' },
      ],
    },
    { name: 'textWrap', type: 'checkbox' },
    spacingRow,
  ]
  const galleryFields: ClientField[] = [
    {
      type: 'row',
      fields: [
        {
          name: 'layout',
          type: 'select',
          options: [
            { label: 'Grid', value: 'grid' },
            { label: 'Masonry', value: 'masonry' },
          ],
        },
        { name: 'columns', type: 'select', options: [{ label: '3', value: '3' }] },
      ],
    },
    spacingRow,
  ]

  const renderLabel = (fields: ClientField[]) =>
    render(
      <LayoutSummaryLabel
        path="layout.0._index-2"
        field={{ type: 'collapsible', label: 'Layout', fields }}
      />,
    )

  it('summarizes the Content block in field order', () => {
    mockFieldValues.set('layout.0.backgroundColor', 'brand-500')
    mockFieldValues.set('layout.0.layout', '2_21')
    mockFieldValues.set('layout.0.verticalAlignment', 'center')
    renderLabel(contentFields)

    expect(screen.getByText('· Brand 500 · 2:1 · Middle aligned')).toBeInTheDocument()
  })

  it('leaves out vertical alignment for a single column', () => {
    mockFieldValues.set('layout.0.backgroundColor', 'transparent')
    mockFieldValues.set('layout.0.layout', '1_1')
    mockFieldValues.set('layout.0.verticalAlignment', 'top')
    renderLabel(contentFields)

    expect(screen.getByText('· Transparent · Full width')).toBeInTheDocument()
  })

  it("shows each of a block's own options and its spacing", () => {
    mockFieldValues.set('layout.0.backgroundColor', 'white')
    mockFieldValues.set('layout.0.imageLayout', 'right')
    mockFieldValues.set('layout.0.textWrap', true)
    mockFieldValues.set('layout.0.spacingTop', 'lg')
    mockFieldValues.set('layout.0.spacingBottom', 'sm')
    renderLabel(imageTextFields)

    expect(
      screen.getByText('· White · Image right · Text wraps · Top: Lg · Btm: Sm'),
    ).toBeInTheDocument()
  })

  it('names option values for fields without a custom summary', () => {
    mockFieldValues.set('layout.0.layout', 'masonry')
    mockFieldValues.set('layout.0.columns', '3')
    mockFieldValues.set('layout.0.spacingBottom', 'none')
    renderLabel(galleryFields)

    expect(screen.getByText('· Masonry · 3 columns · Btm: None')).toBeInTheDocument()
  })

  it("shows a Header's full-width color only when it's ticked", () => {
    const headerFields: ClientField[] = [
      { name: 'backgroundColor', type: 'text' },
      { name: 'fullWidthColor', type: 'checkbox' },
    ]
    mockFieldValues.set('layout.0.backgroundColor', 'brand-200')
    mockFieldValues.set('layout.0.fullWidthColor', true)
    const { unmount } = renderLabel(headerFields)
    expect(screen.getByText('· Brand 200 · Full width')).toBeInTheDocument()
    unmount()

    mockFieldValues.set('layout.0.fullWidthColor', false)
    renderLabel(headerFields)
    expect(screen.getByText('· Brand 200')).toBeInTheDocument()
  })

  it('shows just the title when nothing is set', () => {
    renderLabel([spacingRow])

    expect(screen.getByText('Layout')).toBeInTheDocument()
    expect(screen.queryByText(/·/)).not.toBeInTheDocument()
  })
})

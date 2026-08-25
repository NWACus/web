import { DescriptionWithCharCount } from '@/components/DescriptionWithCharCount'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const mockUseField = jest.fn()

jest.mock('@payloadcms/ui', () => ({
  useField: (...args: unknown[]) => mockUseField(...args),
}))

const field = {
  name: 'description',
  type: 'textarea' as const,
  maxLength: 200,
  admin: { description: 'Short description/summary for event previews.' },
}

describe('DescriptionWithCharCount', () => {
  beforeEach(() => {
    mockUseField.mockReset()
  })

  it('renders the helper text alongside a counter for the current value', () => {
    mockUseField.mockReturnValue({ value: 'A short blurb' })

    render(<DescriptionWithCharCount field={field} path="description" />)

    expect(mockUseField).toHaveBeenCalledWith({ path: 'description' })
    expect(screen.getByText('Short description/summary for event previews.')).toBeInTheDocument()
    expect(screen.getByText('13/200 characters')).toBeInTheDocument()
  })

  it('counts an empty field as zero', () => {
    mockUseField.mockReturnValue({ value: undefined })

    render(<DescriptionWithCharCount field={field} path="description" />)

    expect(screen.getByText('0/200 characters')).toBeInTheDocument()
  })

  it('flags the counter once the value exceeds maxLength', () => {
    mockUseField.mockReturnValue({ value: 'x'.repeat(201) })

    render(<DescriptionWithCharCount field={field} path="description" />)

    expect(screen.getByText('201/200 characters')).toHaveClass('text-error')
  })

  it('does not flag the counter at exactly maxLength', () => {
    mockUseField.mockReturnValue({ value: 'x'.repeat(200) })

    render(<DescriptionWithCharCount field={field} path="description" />)

    expect(screen.getByText('200/200 characters')).not.toHaveClass('text-error')
  })

  it('omits the counter when the field has no maxLength', () => {
    mockUseField.mockReturnValue({ value: 'A short blurb' })

    const { maxLength: _maxLength, ...fieldWithoutMaxLength } = field
    render(<DescriptionWithCharCount field={fieldWithoutMaxLength} path="description" />)

    expect(screen.getByText('Short description/summary for event previews.')).toBeInTheDocument()
    expect(screen.queryByText(/characters$/)).not.toBeInTheDocument()
  })

  it('namespaces the description by path so field-specific admin styles still apply', () => {
    mockUseField.mockReturnValue({ value: '' })

    const { container } = render(<DescriptionWithCharCount field={field} path="meta.description" />)

    expect(container.querySelector('.field-description-meta__description')).toBeInTheDocument()
  })
})

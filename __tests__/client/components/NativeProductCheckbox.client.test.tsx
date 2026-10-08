import { NativeProductCheckbox } from '@/collections/Settings/components/NativeProductCheckbox'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'

const mockSetValue = jest.fn()
const mockOpenModal = jest.fn()
const mockCloseModal = jest.fn()
let mockValue = false

jest.mock('@payloadcms/ui', () => ({
  useField: () => ({
    disabled: false,
    path: 'nativeProducts.forecast',
    setValue: mockSetValue,
    value: mockValue,
  }),
  useFormFields: (selector: (state: [Record<string, { value: unknown }>]) => unknown) =>
    selector([{ tenant: { value: 7 } }]),
  useModal: () => ({ openModal: mockOpenModal, closeModal: mockCloseModal }),
  // Always rendered, so the test drives the dialog without Payload's modal container
  Modal: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode
    onClick: () => void
    disabled?: boolean
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  CheckboxInput: ({
    checked,
    label,
    onToggle,
    readOnly,
  }: {
    checked: boolean
    label: string
    onToggle: () => void
    readOnly: boolean
  }) => (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onToggle}
      disabled={readOnly}
    />
  ),
  FieldDescription: () => null,
}))

type Props = ComponentProps<typeof NativeProductCheckbox>

function renderCheckbox(overrides: Partial<Props> = {}) {
  const field: Props['field'] = { name: 'forecast', label: 'Forecast', type: 'checkbox' }
  return render(
    <NativeProductCheckbox
      field={field}
      path="nativeProducts.forecast"
      readOnly={false}
      {...overrides}
    />,
  )
}

function mockTenant(name: string, slug: string) {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ name, slug }) })
}

beforeEach(() => {
  mockValue = false
  mockTenant('Northwest Avalanche Center', 'nwac')
})

describe('NativeProductCheckbox', () => {
  it('asks for confirmation instead of turning a product on', () => {
    renderCheckbox()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Forecast' }))

    expect(mockOpenModal).toHaveBeenCalledWith('enable-native-product-nativeProducts.forecast')
    expect(mockSetValue).not.toHaveBeenCalled()
  })

  it('turns the product on only once the exact center name is typed', async () => {
    renderCheckbox()
    const turnOn = screen.getByRole('button', { name: 'Turn on' })
    const input = await screen.findByLabelText(/to confirm/)

    fireEvent.change(input, { target: { value: 'Northwest' } })
    expect(turnOn).toBeDisabled()

    fireEvent.change(input, { target: { value: 'Northwest Avalanche Center' } })
    expect(turnOn).toBeEnabled()

    fireEvent.click(turnOn)
    expect(mockSetValue).toHaveBeenCalledWith(true)
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it('turns a product off in one click, without confirmation', () => {
    mockValue = true
    renderCheckbox()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Forecast' }))

    expect(mockSetValue).toHaveBeenCalledWith(false)
    expect(mockOpenModal).not.toHaveBeenCalled()
  })

  it('does nothing for a user without update access', () => {
    renderCheckbox({ readOnly: true })

    const checkbox = screen.getByRole('checkbox', { name: 'Forecast' })
    expect(checkbox).toBeDisabled()
    fireEvent.click(checkbox)

    expect(mockOpenModal).not.toHaveBeenCalled()
    expect(mockSetValue).not.toHaveBeenCalled()
  })

  it('keeps the confirm button disabled while the center name is loading', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false })
    renderCheckbox()

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.getByText(/Loading avalanche center name/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Turn on' })).toBeDisabled()
  })

  it('hides the toggle of a product no center may turn on yet', async () => {
    renderCheckbox({ field: { name: 'weather', label: 'Weather', type: 'checkbox' } })

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(screen.queryByRole('checkbox', { name: 'Weather' })).not.toBeInTheDocument()
  })
})

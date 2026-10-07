import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import type { CheckboxFieldClientProps } from 'payload'

const form: { value: boolean | undefined; archived: boolean } = { value: true, archived: false }
const setValue = jest.fn()

jest.mock('@payloadcms/ui', () => ({
  useField: () => ({ value: form.value, setValue, showError: false, errorMessage: undefined }),
  useFormFields: (select: (ctx: [Record<string, { value: unknown }>]) => unknown) =>
    select([{ archived: { value: form.archived } }]),
  FieldError: () => null,
}))

import { ToggleField } from '@/components/ToggleField'

function renderToggle(lockedBy?: { field: string; value: boolean }, readOnly = false) {
  const props: CheckboxFieldClientProps = {
    path: 'tabs.graphs',
    field: { name: 'graphs', label: 'Graphs', type: 'checkbox' },
    readOnly,
  }
  render(<ToggleField {...props} lockedBy={lockedBy} />)
  return screen.getByRole('switch', { name: 'Graphs' })
}

beforeEach(() => {
  form.value = true
  form.archived = false
  setValue.mockReset()
})

describe('ToggleField', () => {
  it('shows the value and flips it on click', () => {
    const toggle = renderToggle()
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(setValue).toHaveBeenCalledWith(false)
  })

  it('is disabled when the field is read-only', () => {
    expect(renderToggle(undefined, true)).toBeDisabled()
  })

  it('ignores its lock while the locking field is off', () => {
    const toggle = renderToggle({ field: 'archived', value: false })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(toggle).not.toBeDisabled()
    expect(setValue).not.toHaveBeenCalled()
  })

  it('holds the locked value, read-only, and writes it through', () => {
    form.archived = true
    const toggle = renderToggle({ field: 'archived', value: false })
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(toggle).toBeDisabled()
    expect(setValue).toHaveBeenCalledWith(false)
  })
})

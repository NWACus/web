import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const closeMethods: [string, () => void][] = [
  ['Show button', () => fireEvent.click(screen.getByRole('button', { name: 'Show 3 events' }))],
  ['Escape', () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })],
]

function renderDrawer(open?: boolean) {
  const onOpenChange = jest.fn()
  render(
    <MobileFiltersDrawer
      docLabel="events"
      docCount={3}
      hasActiveFilters={false}
      open={open}
      onOpenChange={onOpenChange}
    >
      <label>
        Keyword <input />
      </label>
      <Popover>
        <PopoverTrigger>Pick a date</PopoverTrigger>
        <PopoverContent>calendar</PopoverContent>
      </Popover>
    </MobileFiltersDrawer>,
  )
  return onOpenChange
}

async function openDrawer() {
  fireEvent.click(screen.getByRole('button', { name: 'Open filters' }))
  return screen.findByRole('dialog', { name: 'Filters' })
}

describe('MobileFiltersDrawer', () => {
  it('opens from the Filters button as a dialog named Filters', async () => {
    const onOpenChange = renderDrawer()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    expect(await openDrawer()).toBeVisible()
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it.each(closeMethods)('closes with the %s', async (_, close) => {
    const onOpenChange = renderDrawer()
    await openDrawer()

    close()

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('lets Escape close a popover inside it without closing the drawer', async () => {
    const onOpenChange = renderDrawer()
    const drawer = await openDrawer()
    fireEvent.click(screen.getByRole('button', { name: 'Pick a date' }))

    fireEvent.keyDown(await screen.findByText('calendar'), { key: 'Escape' })

    await waitFor(() => expect(screen.queryByText('calendar')).not.toBeInTheDocument())
    expect(drawer).toBeVisible()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it('keeps the filters and their state while closed', async () => {
    renderDrawer()
    await openDrawer()
    fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: 'rec 1' } })

    fireEvent.click(screen.getByRole('button', { name: 'Show 3 events' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    expect(screen.getByLabelText('Keyword')).toHaveValue('rec 1')
  })

  it('leaves opening to the caller when controlled', () => {
    const onOpenChange = renderDrawer(false)

    fireEvent.click(screen.getByRole('button', { name: 'Open filters' }))

    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

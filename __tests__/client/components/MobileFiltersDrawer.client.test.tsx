import { MobileFiltersDrawer } from '@/components/filters/MobileFiltersDrawer'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

// jsdom has no PointerEvent, so fire plain mouse events under the pointer event names
function drag(element: HTMLElement, fromY: number, toY: number) {
  fireEvent(element, new MouseEvent('pointerdown', { bubbles: true, clientY: fromY }))
  fireEvent(element, new MouseEvent('pointermove', { bubbles: true, clientY: toY }))
  fireEvent(element, new MouseEvent('pointerup', { bubbles: true, clientY: toY }))
}

function renderOpenDrawer() {
  const onOpenChange = jest.fn()
  render(
    <MobileFiltersDrawer
      docLabel="events"
      docCount={3}
      hasActiveFilters={false}
      onOpenChange={onOpenChange}
    >
      <p>filters</p>
    </MobileFiltersDrawer>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Open filters' }))
  onOpenChange.mockClear()

  const dragArea = screen.getByTestId('filters-drawer-drag-area')
  const drawer = dragArea.parentElement
  if (!drawer) throw new Error('drag area has no drawer')
  expect(drawer).toHaveAttribute('aria-hidden', 'false')
  return { dragArea, drawer, onOpenChange }
}

describe('MobileFiltersDrawer', () => {
  it('closes when dragged down past the threshold', () => {
    const { dragArea, drawer, onOpenChange } = renderOpenDrawer()

    drag(dragArea, 100, 300)

    expect(drawer).toHaveAttribute('aria-hidden', 'true')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('snaps back open after a short drag', () => {
    const { dragArea, drawer, onOpenChange } = renderOpenDrawer()

    drag(dragArea, 100, 150)

    expect(drawer).toHaveAttribute('aria-hidden', 'false')
    expect(drawer).not.toHaveStyle({ transform: 'translateY(50px)' })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('follows the pointer while dragging and ignores upward drags', () => {
    const { dragArea, drawer } = renderOpenDrawer()

    fireEvent(dragArea, new MouseEvent('pointerdown', { bubbles: true, clientY: 100 }))
    fireEvent(dragArea, new MouseEvent('pointermove', { bubbles: true, clientY: 160 }))
    expect(drawer).toHaveStyle({ transform: 'translateY(60px)' })

    fireEvent(dragArea, new MouseEvent('pointermove', { bubbles: true, clientY: 40 }))
    expect(drawer.style.transform).toBe('')
  })
})

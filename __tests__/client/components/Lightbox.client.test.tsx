import { Lightbox, LightboxSlide, useLightboxCarousel } from '@/components/Lightbox'
import '@testing-library/jest-dom'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'

const noop = () => {}

function renderLightbox(props: Partial<React.ComponentProps<typeof Lightbox>> = {}) {
  return render(
    <Lightbox
      open
      onOpenChange={noop}
      title="Media viewer"
      index={1}
      count={5}
      onPrev={noop}
      onNext={noop}
      {...props}
    >
      <div>slide</div>
    </Lightbox>,
  )
}

describe('Lightbox', () => {
  it('shows the slide counter and edge arrows for a multi-item lightbox', () => {
    renderLightbox()
    expect(screen.getByText('2 / 5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })

  it('drops the counter and arrows when there is only one item to view', () => {
    renderLightbox({ index: 0, count: 1 })
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    // Close is still the way out of a single-item lightbox.
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('navigates on the arrow keys, from anywhere on the page', () => {
    const onPrev = jest.fn()
    const onNext = jest.fn()
    renderLightbox({ onPrev, onNext })

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowLeft' })

    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrev).toHaveBeenCalledTimes(1)
  })

  it('opens with focus on the dialog, not on the first control', async () => {
    const zoomRef = createRef<ReactZoomPanPinchRef>()
    renderLightbox({ zoomRef })

    // Radix moves focus in an effect, so wait for it to settle.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('dialog')))
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Zoom in' }))
  })

  it('offers zoom controls only when the active slide can zoom', () => {
    const { unmount } = renderLightbox()
    expect(screen.queryByRole('button', { name: 'Zoom in' })).not.toBeInTheDocument()
    unmount()

    const zoomRef = createRef<ReactZoomPanPinchRef>()
    renderLightbox({ zoomRef })
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
  })

  it('drives the zoom surface through the ref it was handed', () => {
    const zoomIn = jest.fn()
    const zoomOut = jest.fn()
    const resetTransform = jest.fn()
    // Only the three methods the controls call are needed; the rest of the library ref isn't.
    const zoomRef: React.RefObject<ReactZoomPanPinchRef | null> = {
      current: Object.assign(Object.create(null), { zoomIn, zoomOut, resetTransform }),
    }

    renderLightbox({ zoomRef })
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset zoom' }))

    expect(zoomIn).toHaveBeenCalledTimes(1)
    expect(zoomOut).toHaveBeenCalledTimes(1)
    expect(resetTransform).toHaveBeenCalledTimes(1)
  })
})

describe('LightboxSlide', () => {
  it('renders a caption when there is one', () => {
    render(<LightboxSlide caption={<p>A photo</p>}>media</LightboxSlide>)
    expect(screen.getByText('A photo')).toBeInTheDocument()
  })

  it('gives the whole slide to the media when there is no caption', () => {
    const { container } = render(<LightboxSlide>media</LightboxSlide>)
    // The media area is the slide's only child, so nothing takes height from the image.
    expect(container.firstElementChild?.children).toHaveLength(1)
  })
})

describe('useLightboxCarousel', () => {
  // Only the four methods the hook touches; `Object.create(null)` keeps this assignable to the
  // full embla api without a cast.
  const carouselAt = (snap: number) =>
    Object.assign(Object.create(null), {
      scrollTo: jest.fn(),
      selectedScrollSnap: () => snap,
      on: jest.fn(),
      off: jest.fn(),
    })

  it('opens on the slide it was asked for, ignoring the carousel from the last open', () => {
    const { result, rerender } = renderHook(
      ({ startIndex, open }) => useLightboxCarousel(startIndex, open),
      { initialProps: { startIndex: 4, open: true } },
    )

    // Embla hands its api up once it boots, reporting the slide it landed on.
    act(() => result.current.setApi(carouselAt(4)))
    expect(result.current.index).toBe(4)

    // The carousel unmounts with the lightbox but never clears that api, so reopening from a
    // different thumbnail must not read the old slide back out of the destroyed instance.
    rerender({ startIndex: 4, open: false })
    rerender({ startIndex: 0, open: true })
    expect(result.current.index).toBe(0)
  })
})

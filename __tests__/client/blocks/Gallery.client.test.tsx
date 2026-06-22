import { GalleryGrid } from '@/blocks/Gallery/GalleryGrid'
import type { Gallery, Media } from '@/payload-types'
import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

const mockImageMedia = jest.fn((_props: { resource?: unknown; fill?: boolean }) => (
  <div data-testid="image-media" />
))
const mockVideoMedia = jest.fn((_props: { resource?: unknown }) => (
  <div data-testid="video-media" />
))

jest.mock('../../../src/components/Media/ImageMedia', () => ({
  ImageMedia: (props: { resource?: unknown }) => mockImageMedia(props),
}))
jest.mock('../../../src/components/Media/VideoMedia', () => ({
  VideoMedia: (props: { resource?: unknown }) => mockVideoMedia(props),
}))

// Render the dialog children only when open so the grid and lightbox can be asserted separately.
jest.mock('../../../src/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Passthrough carousel so lightbox slides render in tests.
jest.mock('../../../src/components/ui/carousel', () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CarouselNext: () => null,
  CarouselPrevious: () => null,
}))

type GalleryItem = NonNullable<Gallery['items']>[number]

const mediaFixture = (id: number, mimeType: string): Media => ({
  id,
  tenant: 1,
  alt: 'alt text',
  mimeType,
  updatedAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
})

const imageResource = mediaFixture(1, 'image/jpeg')
const videoResource = mediaFixture(2, 'video/mp4')

const items: GalleryItem[] = [
  { id: 'a', type: 'video', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', videoTitle: 'A video' },
  { id: 'b', type: 'upload', media: imageResource, caption: 'A photo' },
  { id: 'c', type: 'upload', media: videoResource },
  { id: 'd', type: 'video', videoUrl: 'https://vimeo.com/76979871', videoTitle: 'A vimeo clip' },
]

beforeEach(() => {
  mockImageMedia.mockClear()
  mockVideoMedia.mockClear()
})

describe('GalleryGrid', () => {
  it('renders one trigger per item', () => {
    render(<GalleryGrid items={items} layout="grid" columns="4" />)
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('renders a YouTube thumbnail image for youtube items', () => {
    render(<GalleryGrid items={items} layout="grid" columns="4" />)
    const thumb = screen.getByAltText('A video')
    expect(thumb).toHaveAttribute('src', expect.stringContaining('i.ytimg.com/vi/dQw4w9WgXcQ'))
  })

  it('renders a placeholder (no static thumbnail) for Vimeo items', () => {
    render(<GalleryGrid items={items} layout="grid" columns="4" />)
    // Vimeo has no network-free thumbnail, so the title appears as text, not an <img>.
    expect(screen.queryByAltText('A vimeo clip')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'A vimeo clip' })).toBeInTheDocument()
  })

  it('uses ImageMedia and VideoMedia for the right upload types', () => {
    render(<GalleryGrid items={items} layout="grid" columns="4" />)
    expect(mockImageMedia).toHaveBeenCalledWith(
      expect.objectContaining({ resource: imageResource }),
    )
    expect(mockVideoMedia).toHaveBeenCalledWith(
      expect.objectContaining({ resource: videoResource }),
    )
  })

  it('opens a lightbox with an embedded iframe when a youtube item is clicked', () => {
    render(<GalleryGrid items={items} layout="grid" columns="4" />)
    fireEvent.click(screen.getByRole('button', { name: 'A video' }))
    const iframe = screen.getByTitle('A video')
    expect(iframe).toHaveAttribute('src', expect.stringContaining('youtube-nocookie.com/embed'))
    expect(iframe.getAttribute('src')).toContain('autoplay=1')
  })
})

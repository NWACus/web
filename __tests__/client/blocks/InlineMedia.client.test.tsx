import { InlineMediaComponent } from '@/blocks/InlineMedia/Component'
import type { Media } from '@/payload-types'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

// Stand in for the next/image-backed Media component and record the props it receives.
const mockMedia = jest.fn((_props: { sizes?: string }) => null)

jest.mock('../../../src/components/Media', () => ({
  Media: (props: { sizes?: string }) => mockMedia(props),
}))

// InlineMedia only renders when `media` is a resolved object.
const media: Media = { id: 1, tenant: 1, alt: 'test', updatedAt: '', createdAt: '' }

beforeEach(() => mockMedia.mockClear())

describe('InlineMediaComponent', () => {
  it.each([
    ['25', 'w-1/4'],
    ['50', 'w-1/2'],
    ['75', 'w-3/4'],
    ['100', 'w-full'],
  ] as const)('sizes the %s%% block to a container fraction (%s)', (size, expectedClass) => {
    const { container } = render(<InlineMediaComponent media={media} size={size} />)
    expect(container.firstElementChild).toHaveClass(expectedClass)
  })

  it('renders original at natural size', () => {
    const { container } = render(<InlineMediaComponent media={media} size="original" />)
    expect(container.firstElementChild).toHaveClass('max-w-fit')
  })

  it.each(['25', '100', 'original'] as const)(
    'requests resolution from the rendered width via sizes="auto" (%s)',
    (size) => {
      render(<InlineMediaComponent media={media} size={size} />)
      expect(mockMedia).toHaveBeenCalledWith(expect.objectContaining({ sizes: 'auto' }))
    },
  )

  it('renders a fixed-height image with sizes="auto"', () => {
    render(<InlineMediaComponent media={media} size="fixed-height" fixedHeight={120} />)
    expect(mockMedia).toHaveBeenCalledWith(expect.objectContaining({ sizes: 'auto' }))
  })

  it('renders nothing when the media relationship is unresolved', () => {
    const { container } = render(<InlineMediaComponent media={1} size="50" />)
    expect(container).toBeEmptyDOMElement()
    expect(mockMedia).not.toHaveBeenCalled()
  })
})

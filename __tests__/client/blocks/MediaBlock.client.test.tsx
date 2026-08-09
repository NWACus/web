import { MediaBlockComponent } from '@/blocks/Media/Component'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import { ComponentProps } from 'react'

// Stand in for the next/image-backed Media component and record the props it receives.
const mockMedia = jest.fn((_props: { sizes?: string }) => null)

jest.mock('../../../src/components/Media', () => ({
  Media: (props: { sizes?: string }) => mockMedia(props),
}))

jest.mock('../../../src/components/RichText', () => ({
  __esModule: true,
  default: () => null,
}))

type Props = ComponentProps<typeof MediaBlockComponent>

beforeEach(() => mockMedia.mockClear())

function renderBlock(imageSize?: Props['imageSize']) {
  const { container } = render(
    <MediaBlockComponent
      blockType="mediaBlock"
      media={1}
      isLayoutBlock={false}
      backgroundColor="brand-100"
      imageSize={imageSize}
    />,
  )
  // The size class lives on the div that wraps the image (the only `.gap-2` element).
  return container.querySelector('.gap-2')
}

describe('MediaBlockComponent', () => {
  it.each([
    ['xsmall', 'max-w-[max(12rem,33cqw)]'],
    ['small', 'max-w-[max(16rem,50cqw)]'],
    ['medium', 'max-w-[max(20rem,75cqw)]'],
    ['large', 'max-w-[max(24rem,90cqw)]'],
    ['full', 'max-w-full'],
  ] as const)('sizes the %s block relative to its container (%s)', (imageSize, expectedClass) => {
    const sizeWrapper = renderBlock(imageSize)
    expect(sizeWrapper).toHaveClass(expectedClass)
    // non-original sizes fill the container up to their cap
    expect(sizeWrapper).toHaveClass('w-full')
  })

  it('renders original at natural size without filling the container', () => {
    const sizeWrapper = renderBlock('original')
    expect(sizeWrapper).toHaveClass('max-w-fit')
    expect(sizeWrapper).not.toHaveClass('w-full')
  })

  it('defaults to original when no size is set', () => {
    expect(renderBlock(undefined)).toHaveClass('max-w-fit')
  })

  it.each(['xsmall', 'small', 'medium', 'large', 'full', 'original'] as const)(
    'requests resolution from the rendered width via sizes="auto" (%s)',
    (imageSize) => {
      renderBlock(imageSize)
      expect(mockMedia).toHaveBeenCalledWith(expect.objectContaining({ sizes: 'auto' }))
    },
  )
})

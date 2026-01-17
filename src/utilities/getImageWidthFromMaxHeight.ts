import type { Media } from '@/payload-types'

/**
 * Calculate the width of an image when constrained to a max height, preserving aspect ratio.
 * Returns a CSS size string (e.g., "150px") for use in image `size` props.
 *
 * @param image - The image resource (Media object or unresolved ID)
 * @param maxHeight - The maximum height constraint in pixels
 * @returns CSS size string with calculated width in pixels
 */
export const getImageWidthFromMaxHeight = (image: number | Media, maxHeight: number): string => {
  if (typeof image === 'number') return `${maxHeight}px`
  // Calculate width: (maxHeight * originalWidth) / originalHeight
  const width = Math.round((maxHeight * (image.width ?? maxHeight)) / (image.height ?? maxHeight))
  return `${width}px`
}

import { cssVariables } from '@/cssVariables'

const { breakpoints, container } = cssVariables

// Mirrors `theme.container.padding` (px per side) in tailwind.config.mjs.
const CONTAINER_PADDING_PX = { base: 16, sm: 16, md: 32, lg: 32, xl: 32, '2xl': 32 }

const containerInnerWidth = {
  sm: container.sm - 2 * CONTAINER_PADDING_PX.sm,
  md: container.md - 2 * CONTAINER_PADDING_PX.md,
  lg: container.lg - 2 * CONTAINER_PADDING_PX.lg,
  xl: container.xl - 2 * CONTAINER_PADDING_PX.xl,
  '2xl': container['2xl'] - 2 * CONTAINER_PADDING_PX['2xl'],
}

// `gap-x-10` on the Content grid = 2.5rem.
const GRID_GAP_PX = 40

// Container width across viewports; `'full'` means it tracks the viewport (100vw).
export type ContainerSizes = {
  segments: { minViewport: number; width: number | 'full' }[]
}

// `percent` of the container width, but never smaller than `floorPx`.
export type SizeSpec = { percent: number; floorPx: number }

// Keep in sync with the cqw class literals in Media/Component.tsx.
export const IMAGE_SIZE_SPECS: Record<string, SizeSpec | null> = {
  small: { percent: 50, floorPx: 256 }, // max-w-[max(16rem,50cqw)]
  medium: { percent: 75, floorPx: 320 }, // max-w-[max(20rem,75cqw)]
  large: { percent: 90, floorPx: 384 }, // max-w-[max(24rem,90cqw)]
  full: { percent: 100, floorPx: 0 }, // max-w-full
  original: null, // natural size
}

// Fallback when there's no column context (single-column / full-width).
export const FULL_WIDTH_CONTAINER: ContainerSizes = {
  segments: [{ minViewport: 0, width: 'full' }],
}

const GRID_BREAKPOINTS: { key: string; vw: number; inner: number | 'full'; total: number }[] = [
  { key: 'base', vw: 0, inner: 'full', total: 6 },
  { key: 'sm', vw: breakpoints.sm, inner: containerInnerWidth.sm, total: 6 },
  { key: 'md', vw: breakpoints.md, inner: containerInnerWidth.md, total: 6 },
  { key: 'lg', vw: breakpoints.lg, inner: containerInnerWidth.lg, total: 12 },
  { key: 'xl', vw: breakpoints.xl, inner: containerInnerWidth.xl, total: 12 },
  { key: '2xl', vw: breakpoints['2xl'], inner: containerInnerWidth['2xl'], total: 12 },
]

function columnWidth(innerWidth: number, span: number, total: number): number {
  const track = (innerWidth - (total - 1) * GRID_GAP_PX) / total
  return Math.round(track * span + (span - 1) * GRID_GAP_PX)
}

function parseSpans(spanClass: string): Record<string, number> {
  const spans: Record<string, number> = { base: 6 }
  // optional `bp:` prefix (sm/md/lg/xl/2xl) followed by `col-span-N`
  const re = /(?:(sm|md|lg|xl|2xl):)?col-span-(\d+)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(spanClass))) {
    spans[match[1] ?? 'base'] = Number(match[2])
  }
  return spans
}

// Resolves a Content column's responsive `col-span-*` classes to its width per viewport.
export function buildColumnSizes(spanClass: string): ContainerSizes {
  const spans = parseSpans(spanClass)
  const segments: ContainerSizes['segments'] = []
  let currentSpan = spans.base
  for (const bp of GRID_BREAKPOINTS) {
    if (spans[bp.key] != null) currentSpan = spans[bp.key]
    const width: number | 'full' =
      bp.inner === 'full' || currentSpan >= bp.total
        ? 'full'
        : columnWidth(bp.inner, currentSpan, bp.total)
    const last = segments[segments.length - 1]
    if (!last || last.width !== width) segments.push({ minViewport: bp.vw, width })
  }
  return { segments }
}

// Builds a `sizes` attribute mirroring the cqw CSS: min(container, max(floorPx, percent%)).
export function buildImageSizes(
  { segments }: ContainerSizes,
  { percent, floorPx }: SizeSpec,
): string {
  return segments
    .map((s, i) => {
      const value =
        s.width === 'full'
          ? floorPx
            ? `max(${floorPx}px, ${percent}vw)`
            : `${percent}vw`
          : `${Math.min(s.width, Math.max(floorPx, Math.round((percent / 100) * s.width)))}px`
      const next = segments[i + 1]
      return next ? `(max-width: ${next.minViewport}px) ${value}` : value
    })
    .join(', ')
}

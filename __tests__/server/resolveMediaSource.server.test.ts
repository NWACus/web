import type { Media, SharedMedia } from '@/payload-types'
import { resolveMediaSource } from '@/utilities/resolveMediaSource'

const timestamps = { createdAt: '2026-09-21T00:00:00.000Z', updatedAt: '2026-09-21T00:00:00.000Z' }

const centerPhoto: Media = { id: 1, tenant: 1, alt: "the center's own photo", ...timestamps }
const sharedPhoto: SharedMedia = { id: 2, alt: 'a shared photo', ...timestamps }

describe('resolveMediaSource', () => {
  it('returns the shared document when the slot says shared', () => {
    expect(
      resolveMediaSource({ source: 'shared', media: centerPhoto, sharedMedia: sharedPhoto }),
    ).toBe(sharedPhoto)
  })

  it("returns the center's document when the slot says center", () => {
    expect(
      resolveMediaSource({ source: 'center', media: centerPhoto, sharedMedia: sharedPhoto }),
    ).toBe(centerPhoto)
  })

  it("returns the center's document when the slot has no source, as pre-existing content does", () => {
    expect(resolveMediaSource({ media: centerPhoto })).toBe(centerPhoto)
    expect(resolveMediaSource({ source: null, media: centerPhoto })).toBe(centerPhoto)
  })

  it('never falls back across libraries when the chosen side is empty', () => {
    expect(resolveMediaSource({ source: 'shared', media: centerPhoto })).toBeUndefined()
    expect(resolveMediaSource({ source: 'center', sharedMedia: sharedPhoto })).toBeUndefined()
  })

  it('passes through unresolved ids', () => {
    expect(resolveMediaSource({ source: 'shared', media: 1, sharedMedia: 2 })).toBe(2)
    expect(resolveMediaSource({ media: 1, sharedMedia: 2 })).toBe(1)
  })
})

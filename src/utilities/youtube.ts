/**
 * Parses a YouTube video ID from the common URL forms without any network call:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 *
 * Returns null when no valid 11-character ID can be extracted.
 */
export function getYouTubeId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null

  const trimmed = url.trim()
  const idPattern = /^[a-zA-Z0-9_-]{11}$/

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0]
      return idPattern.test(id) ? id : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const vParam = parsed.searchParams.get('v')
      if (vParam && idPattern.test(vParam)) return vParam

      const segments = parsed.pathname.split('/').filter(Boolean)
      if (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'v') {
        const id = segments[1]
        return id && idPattern.test(id) ? id : null
      }
    }

    return null
  } catch {
    // Not a parseable URL — accept a bare ID, otherwise give up.
    return idPattern.test(trimmed) ? trimmed : null
  }
}

export function getYouTubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

export function getYouTubeEmbedUrl(id: string, autoplay = false): string {
  const params = new URLSearchParams({
    rel: '0',
    ...(autoplay ? { autoplay: '1' } : {}),
  })
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`
}

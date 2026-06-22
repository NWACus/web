/**
 * Parses hosted-video URLs (YouTube, Vimeo) into a provider + ID without any
 * network call, and builds embed/thumbnail URLs from the result.
 *
 * Supported URL forms:
 * - YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed|shorts|v/ID
 * - Vimeo:   vimeo.com/ID, player.vimeo.com/video/ID
 */

export type VideoProvider = 'youtube' | 'vimeo'

export type ParsedVideo = {
  provider: VideoProvider
  id: string
}

export const videoProviderLabels: Record<VideoProvider, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
}

// YouTube IDs are exactly 11 url-safe chars; Vimeo IDs are numeric.
const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/
const numericIdPattern = /^[0-9]+$/

export function parseVideoUrl(url: string | null | undefined): ParsedVideo | null {
  if (!url || typeof url !== 'string') return null

  const trimmed = url.trim()

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')
    const segments = parsed.pathname.split('/').filter(Boolean)

    if (host === 'youtu.be') {
      const id = segments[0]
      return id && youtubeIdPattern.test(id) ? { provider: 'youtube', id } : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const vParam = parsed.searchParams.get('v')
      if (vParam && youtubeIdPattern.test(vParam)) return { provider: 'youtube', id: vParam }

      if (['embed', 'shorts', 'v'].includes(segments[0]) && segments[1]) {
        return youtubeIdPattern.test(segments[1]) ? { provider: 'youtube', id: segments[1] } : null
      }
      return null
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      // player.vimeo.com/video/ID or vimeo.com/ID
      const id = segments[0] === 'video' ? segments[1] : segments[0]
      return id && numericIdPattern.test(id) ? { provider: 'vimeo', id } : null
    }

    return null
  } catch {
    // Not a parseable URL — accept a bare YouTube ID, otherwise give up.
    return youtubeIdPattern.test(trimmed) ? { provider: 'youtube', id: trimmed } : null
  }
}

export function getVideoEmbedUrl({ provider, id }: ParsedVideo, autoplay = false): string {
  switch (provider) {
    case 'youtube': {
      const params = new URLSearchParams({ rel: '0', ...(autoplay ? { autoplay: '1' } : {}) })
      return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`
    }
    case 'vimeo': {
      const params = new URLSearchParams(autoplay ? { autoplay: '1' } : {})
      const query = params.toString()
      return `https://player.vimeo.com/video/${id}${query ? `?${query}` : ''}`
    }
  }
}

/**
 * A network-free thumbnail URL, when the provider exposes one. YouTube serves
 * static thumbnails; Vimeo requires an API call, so it returns null and callers
 * should render a placeholder instead.
 */
export function getVideoThumbnail({ provider, id }: ParsedVideo): string | null {
  return provider === 'youtube' ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
}

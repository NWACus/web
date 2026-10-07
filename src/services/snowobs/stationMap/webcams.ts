/**
 * Webcam image helpers, kept pure so the URL parsing is unit tested.
 */

// The watch-page, short-link, live and embed forms a forecaster might paste into the dashboard.
const YOUTUBE_ID_PATTERNS = [
  /[?&]v=([\w-]{6,})/,
  /youtu\.be\/([\w-]{6,})/,
  /youtube\.com\/(?:live|embed|shorts)\/([\w-]{6,})/,
]

/** The embeddable player URL for a YouTube link, or null when the link isn't one. */
export function youtubeEmbedUrl(url: string): string | null {
  if (!/youtu\.?be/.test(url)) return null
  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = url.match(pattern)
    if (match) return `https://www.youtube.com/embed/${match[1]}`
  }
  return null
}

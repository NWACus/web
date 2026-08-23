/**
 * Forecast HTML sanitization using sanitize-html.
 *
 * Pure JS with no DOM dependency, so it runs in server components. (DOMPurify
 * would need jsdom on the server, which does not survive Next's server bundle.)
 * More restrictive than GenericEmbedBlock — no scripts or forms, and the only
 * iframes that survive are video embeds from an explicit provider allowlist.
 */
import sanitizeHtmlLib, { type Attributes, type Tag } from 'sanitize-html'

import { getVideoEmbedUrl, parseVideoUrl } from '@/utilities/videoEmbed'

const ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'img',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'strong',
  'em',
  'br',
  'figure',
  'figcaption',
  'span',
  'div',
  'sup',
  'sub',
  'iframe',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'class', 'style']

/**
 * A tag name deliberately absent from ALLOWED_TAGS, and listed in `nonTextTags` below so its
 * contents go with it. sanitize-html applies transformTags before checking the allowlist, so
 * renaming an element to this is how an element gets removed outright — `allowedIframeHostnames`
 * merely deletes the `src` and leaves an empty frame behind.
 */
const DROPPED = 'afp-blocked-embed'

const FACEBOOK_EMBED_PATHS = ['/plugins/video.php', '/plugins/post.php']

/** Absolute (http/https) and protocol-relative URLs point off the AvyWeb tenant
 * site. All forecast HTML comes from the NAC API, so any absolute link is to
 * another domain; open those in a new tab. Relative links stay in the same tab. */
const isExternalUrl = (href: string | undefined): boolean => !!href && /^(https?:)?\/\//i.test(href)

/** The parsed http(s) URL, or `null` if `value` is relative, unparseable or another scheme. */
function httpUrl(value: string | undefined): URL | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

/**
 * The embed URL to use for an authored iframe, or `null` if it isn't a recognized video embed.
 *
 * Forecasters paste these into the AFP dashboard's rich-text editor, and the legacy widget rendered
 * whatever came back with `v-html`. The live API only contains YouTube `/embed/` frames and
 * Facebook's video plugin; Vimeo comes along because it shares AvyWeb's video-URL parser. Anything
 * else is not framed.
 */
function safeEmbedUrl(src: string | undefined): string | null {
  const url = httpUrl(src)
  // Relative or unparseable srcs are never embeddable provider URLs. (Bailing here also keeps
  // parseVideoUrl's bare-video-id fallback from turning a relative src into a YouTube embed.)
  if (!url) return null

  const video = parseVideoUrl(url.toString())
  if (video) return withPreservedParams(getVideoEmbedUrl(video), url)

  // Facebook's content embeds. Named individually rather than allowing all of /plugins/*, which
  // also serves interactive social widgets (like, comments, page) that nothing in the corpus uses.
  // https only — an http frame is blocked as mixed content and renders as an empty box, which is
  // the silent failure this allowlist exists to prevent.
  if (url.protocol === 'https:' && url.hostname === 'www.facebook.com') {
    if (FACEBOOK_EMBED_PATHS.includes(url.pathname)) return url.toString()
  }

  return null
}

/**
 * Playback parameters carried from the authored URL onto the rebuilt embed URL.
 *
 * `getVideoEmbedUrl` reconstructs the URL from the video id alone. That is fine for a plain video,
 * but a YouTube playlist is `/embed/videoseries?list=…` — and `videoseries` is itself eleven
 * characters, so it passes for a video id and the rebuilt URL asks YouTube for a video by that
 * name. Same story, less visibly, for a start offset or a Vimeo private-video hash.
 */
const PRESERVED_EMBED_PARAMS = ['list', 'index', 'start', 'end', 't', 'h']

function withPreservedParams(embedUrl: string, authored: URL): string {
  const url = new URL(embedUrl)
  for (const name of PRESERVED_EMBED_PARAMS) {
    const value = authored.searchParams.get(name)
    if (value) url.searchParams.set(name, value)
  }
  return url.toString()
}

/**
 * What to render in place of an embed we won't frame.
 *
 * A link, not nothing: the reader can still reach what the forecaster meant to show, and the
 * hostname is in the label so they can see where it goes before following it. Forecast HTML already
 * carries authored links from the same source, so this grants the author no reach they didn't have.
 * A src that isn't http(s) has nothing safe to link to, so it goes away entirely.
 */
function blockedEmbed(src: string | undefined): Tag {
  const url = httpUrl(src)
  if (!url || !src) return { tagName: DROPPED, attribs: {} }

  return {
    tagName: 'a',
    attribs: { href: src, target: '_blank', rel: 'noopener noreferrer' },
    text: `Open embedded content from ${url.hostname}`,
  }
}

/** A positive integer from an authored width/height attribute, or `null` (e.g. `"100%"`). */
function pixelDimension(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * Size the frame by aspect ratio rather than by the authored pixel height.
 *
 * The authored dimensions are the forecaster's screen size (16:9 for YouTube, 267×476 for
 * Facebook's portrait video plugin). Keeping the height as authored, which is what the legacy
 * widget did, letterboxes or squashes the video once the column is narrower than that width.
 */
function embedSizing(width: string | undefined, height: string | undefined): string {
  const w = pixelDimension(width)
  const h = pixelDimension(height)
  if (!w || !h) return 'aspect-ratio: 16 / 9; width: 100%; height: auto'
  return `aspect-ratio: ${w} / ${h}; width: min(100%, ${w}px); height: auto`
}

// Matches a whole `height: …` declaration at the start of the style attribute or after a `;`.
// The leading boundary is what keeps it off `max-height` and `line-height`.
const INLINE_HEIGHT_DECLARATION = /(^|;)\s*height\s*:[^;]*/gi

/**
 * Drop any inline `height`, so a clamped image keeps its aspect ratio.
 *
 * Authored images carry `style="width: 1228px; height: 444px"`. The declared width is honored up to
 * the column width, but a surviving pixel height then stretches the image. The legacy widget forced
 * `height: auto !important` on every forecast image for the same reason.
 */
function withoutInlineHeight(style: string | undefined): string | undefined {
  if (!style) return undefined
  const stripped = style
    .replace(INLINE_HEIGHT_DECLARATION, '$1')
    .replace(/^;+|;+$/g, '')
    .trim()
  return stripped || undefined
}

export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      '*': ALLOWED_ATTR,
      a: [...ALLOWED_ATTR, 'target', 'rel'],
      // The AFP editor marks an embedded video by hanging the YouTube id off the poster image;
      // the discussion's embedded-media collector reads it back out.
      img: [...ALLOWED_ATTR, 'data-video-id'],
      iframe: [
        'src',
        'title',
        'class',
        'style',
        'allow',
        'allowfullscreen',
        'loading',
        'referrerpolicy',
      ],
    },
    // Drop a blocked embed's fallback content along with the element. Without this, sanitize-html
    // keeps the text of a discarded tag ("We want the contents but not this tag").
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', DROPPED],
    transformTags: {
      a: (tagName, attribs) =>
        isExternalUrl(attribs.href)
          ? { tagName, attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' } }
          : { tagName, attribs },

      img: (tagName, attribs): Tag => {
        const style = withoutInlineHeight(attribs.style)
        const { style: _authoredStyle, ...rest }: Attributes = attribs
        return { tagName, attribs: style ? { ...rest, style } : rest }
      },

      iframe: (tagName, attribs): Tag => {
        const src = safeEmbedUrl(attribs.src)
        if (!src) return blockedEmbed(attribs.src)

        return {
          tagName,
          attribs: {
            src,
            title: attribs.title || 'Embedded video',
            class: 'max-w-full border-0',
            style: embedSizing(attribs.width, attribs.height),
            // The set YouTube's own embed code asks for, and the same one the forecast lightbox
            // and the Gallery block use. No `sandbox`: the src is one of a handful of vetted
            // provider URLs, and a wrong sandbox flag fails as a blank frame.
            allow:
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowfullscreen: 'allowfullscreen',
            referrerpolicy: 'strict-origin-when-cross-origin',
            loading: 'lazy',
          },
        }
      },
    },
  })
}

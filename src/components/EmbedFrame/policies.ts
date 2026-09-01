/**
 * Per-block sanitize/sandbox policies for embed blocks.
 *
 * Splitting these out keeps each embed block's security boundary explicit: the generic block
 * stays free of provider-specific concessions, and the video block never executes scripts.
 * The form block shares this attribute list but sets its own policy in
 * `src/blocks/FormEmbed/Component.tsx` — it renders in the page instead of in a sandboxed
 * iframe, because checkout SDKs need a rewritable document URL and a full-viewport overlay.
 */

// Attributes common to all sandboxed embeds.
export const BASE_ADD_ATTR = [
  'allow',
  'allowfullscreen',
  'async',
  'frameborder',
  'height',
  'id',
  'name',
  'sandbox',
  'scrolling',
  'src',
  'style',
  'title',
  'type',
  'width',
]

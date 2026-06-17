/**
 * Per-block sanitize/sandbox policies for embed blocks.
 *
 * Splitting these out keeps each embed block's security boundary explicit: the generic block
 * stays free of provider-specific concessions, the video block never executes scripts, and only
 * the form block opts into the broader permissions (e.g. `dbox-widget`, payment attributes)
 * required by script-based form/donation providers like DonorBox.
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

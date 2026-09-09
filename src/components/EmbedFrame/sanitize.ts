import DOMPurify from 'dompurify'

/** The extra tags and attributes an embed block's policy opts into. See `./policies.ts`. */
export type EmbedSanitizePolicy = {
  addTags: string[]
  addAttr: string[]
}

// Normalize curly quotes that DOMParser/DOMPurify parse incorrectly
const normalize = (html: string) => html.replaceAll('“', '"').replaceAll('”', '"')

/** Sanitized markup, for an embed that builds a document of its own to hand to an iframe. */
export const sanitizeEmbedHtml = (
  html: string,
  { addTags, addAttr }: EmbedSanitizePolicy,
): string =>
  DOMPurify.sanitize(normalize(html), {
    ADD_TAGS: addTags,
    ADD_ATTR: addAttr,
    FORCE_BODY: true,
  })

/**
 * Sanitized nodes, for an embed that renders into the page. DOMPurify parses through DOMParser,
 * which marks `<script>` elements unexecutable, and FORCE_BODY keeps a leading one from being
 * hoisted into `<head>` — which is exactly where provider snippets put theirs.
 */
export const sanitizeEmbedFragment = (
  html: string,
  { addTags, addAttr }: EmbedSanitizePolicy,
): DocumentFragment =>
  DOMPurify.sanitize(normalize(html), {
    ADD_TAGS: addTags,
    ADD_ATTR: addAttr,
    FORCE_BODY: true,
    RETURN_DOM_FRAGMENT: true,
  })

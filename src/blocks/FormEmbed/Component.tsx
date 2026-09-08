'use client'

import { BASE_ADD_ATTR } from '@/components/EmbedFrame/policies'
import type { FormEmbedBlock as FormEmbedBlockProps } from '@/payload-types'
import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import DOMPurify from 'dompurify'
import { useEffect, useId, useRef } from 'react'

type Props = FormEmbedBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

// Sanitize policy for form/donation provider snippets. There is no sandbox here: unlike the
// generic and video embeds, this block renders into the page rather than into an iframe.
// Checkout SDKs (Classy/GoFundMe, DonorBox, …) drive their state through `history.pushState` and
// read it back off `window.location`, and they open their payment flow as a full-viewport overlay.
// A `blob:`/`srcdoc` iframe document has no rewritable URL, so `pushState` throws a SecurityError
// and the flow dies on the first click; an auto-height iframe also collapses the overlay to
// nothing. `script` is in the allowlist below, so DOMPurify passes inline JS through untouched:
// it removes markup an editor did not intend to write, not code they deliberately pasted. Who may
// edit content holding this block is the real boundary — see docs/decisions/017-form-embeds-in-page.md.
export const FORM_EMBED_POLICY = {
  addTags: ['iframe', 'script', 'style', 'dbox-widget'],
  addAttr: [...BASE_ADD_ATTR, 'allowpaymentrequest', 'campaign', 'classy', 'enable-auto-scroll'],
}

// How long to wait on a blocking loader before inserting the scripts that follow it. A CDN that
// accepts the connection and never answers fires neither `load` nor `error` until the network
// layer gives up, which is far longer than a donor will wait.
const SCRIPT_LOAD_TIMEOUT_MS = 10_000

// Matches the run of `@charset`/`@import` statements at the very start of a stylesheet, along with
// any whitespace and comments between them. Those two at-rules are only legal at the top of a
// stylesheet, so they have to be hoisted back out of the `@scope` wrapper below.
const LEADING_AT_RULES = /^(?:\s+|\/\*[\s\S]*?\*\/|@(?:charset|import)\b[^;]*;)+/i

// Tailwind's Preflight zeroes borders and padding on every element and strips button backgrounds.
// Provider snippets were written for a document without it and mostly style only what they mean to
// change, so restore the browser defaults for form controls inside the embed — otherwise the
// Mailchimp footer forms render their fields with no visible boundary. These element selectors beat
// Preflight's `*` and lose to the provider's own `#id`-based rules.
const controlReset = (scopeId: string) =>
  `@scope ([data-form-embed="${scopeId}"]) {\n` +
  `input, select, textarea, button { border: revert; padding: revert; background-color: revert; background-image: revert; }\n` +
  `}`

// Provider CSS is written for a document of its own. Confine each <style> to this embed before it
// reaches the page, so a bare `html, body { … }` rule — which the Mailchimp footer snippets ship —
// cannot restyle the rest of the site. @scope leaves the rules' own specificity alone, and a
// browser without it drops the block, costing the embed its styling rather than leaking it.
const scopeStyles = (fragment: DocumentFragment, scopeId: string) => {
  for (const style of Array.from(fragment.querySelectorAll('style'))) {
    const css = style.textContent ?? ''
    const leading = css.match(LEADING_AT_RULES)?.[0] ?? ''
    // Only hoist when the leading run actually held an at-rule; a stray comment can stay put.
    const hoisted = /@(?:charset|import)\b/i.test(leading) ? `${leading.trim()}\n` : ''
    const rules = hoisted ? css.slice(leading.length) : css

    style.textContent = `${hoisted}@scope ([data-form-embed="${scopeId}"]) {\n${rules}\n}`
  }
}

export const FormEmbedBlockComponent = ({
  html,
  backgroundColor = 'transparent',
  alignContent = 'left',
  className,
  isLayoutBlock = true,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  // Identifies this embed's subtree so its CSS can be scoped to it. React's useId wraps the value
  // in punctuation that is awkward inside a selector, so keep only the alphanumeric part.
  const scopeId = useId().replace(/[^a-zA-Z0-9]/g, '')

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !html) return

    // Normalize curly quotes that DOMParser/DOMPurify parse incorrectly
    const normalizedHTML = html.replaceAll('“', '"').replaceAll('”', '"')

    // DOMPurify parses through DOMParser, which marks <script> elements unexecutable, and
    // FORCE_BODY keeps a leading one from being hoisted into <head> — which is exactly where
    // provider snippets put theirs. Taking the fragment back saves a serialize and a re-parse.
    const fragment = DOMPurify.sanitize(normalizedHTML, {
      ADD_TAGS: FORM_EMBED_POLICY.addTags,
      ADD_ATTR: FORM_EMBED_POLICY.addAttr,
      FORCE_BODY: true,
      RETURN_DOM_FRAGMENT: true,
    })

    scopeStyles(fragment, scopeId)
    container.appendChild(fragment)

    // A <script> parsed out of a string is inert. Rebuild each one so the browser runs it, and
    // insert them one at a time: an inline script runs the moment it lands in the document, so a
    // snippet pairing a loader with an inline call into it (Mailchimp, Eventbrite) needs the loader
    // to have finished first. `async = false` alone only orders the external scripts against each
    // other — under the HTML parser a blocking external script also held back the inline ones.
    let cancelled = false
    let releasePending: (() => void) | null = null

    const runScripts = async () => {
      for (const inert of Array.from(container.querySelectorAll('script'))) {
        if (cancelled) return

        const script = document.createElement('script')
        for (const { name, value } of Array.from(inert.attributes)) script.setAttribute(name, value)
        script.textContent = inert.textContent
        // Inserted scripts default to async; hold the ones that didn't ask for it to source order.
        if (!inert.hasAttribute('async')) script.async = false

        const blocks = Boolean(script.src) && !script.async
        const settled = blocks
          ? new Promise<void>((resolve) => {
              // A provider CDN that 404s or hangs shouldn't strand the rest of the snippet, and
              // neither should an unmount that lands while the wait is still open.
              const timer = setTimeout(resolve, SCRIPT_LOAD_TIMEOUT_MS)
              const release = () => {
                clearTimeout(timer)
                releasePending = null
                resolve()
              }

              script.onload = release
              script.onerror = release
              releasePending = release
            })
          : null

        inert.replaceWith(script)
        if (settled) await settled
      }
    }

    void runScripts()

    // Only our own nodes come back out. The provider's globals and whatever it appended elsewhere
    // (modal roots on document.body) stay. Note the provider script re-runs on every mount, so a
    // navigation away and back re-initializes the SDK on a page where its globals already exist.
    return () => {
      cancelled = true
      releasePending?.()
      container.replaceChildren()
    }
  }, [html, scopeId])

  // `EmbedFrame` rendered nothing without a snippet; without this the wrapper's own padding would
  // leave a band of blank space on a page whose embed code has not been filled in yet.
  if (!html) return null

  return (
    <div className={cn(bgColorClass, textColor)}>
      <style>{controlReset(scopeId)}</style>
      <div
        className={cn(
          isLayoutBlock && 'container py-10',
          'flex flex-col',
          alignContent === 'left' && 'items-start',
          alignContent === 'center' && 'items-center',
          alignContent === 'right' && 'items-end',
          className,
        )}
      >
        <div ref={containerRef} data-form-embed={scopeId} className="w-full" />
      </div>
    </div>
  )
}

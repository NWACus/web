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

    const sanitized = DOMPurify.sanitize(normalizedHTML, {
      ADD_TAGS: FORM_EMBED_POLICY.addTags,
      ADD_ATTR: FORM_EMBED_POLICY.addAttr,
      FORCE_BODY: true,
    })

    // A <template> parses the snippet as-is. Parsing it as a document would hoist a leading
    // <script> into <head>, which is exactly where provider snippets put theirs.
    const template = document.createElement('template')
    template.innerHTML = sanitized

    // Provider CSS is written for a document of its own. Confine each <style> to this embed before
    // it reaches the page, so a bare `html, body { … }` rule — which the Mailchimp footer snippets
    // ship — cannot restyle the rest of the site. @scope leaves the rules' own specificity alone,
    // and a browser without it drops the block, costing the embed its styling rather than leaking.
    for (const style of Array.from(template.content.querySelectorAll('style'))) {
      style.textContent = `@scope ([data-form-embed="${scopeId}"]) {\n${style.textContent}\n}`
    }

    container.appendChild(document.importNode(template.content, true))

    // A <script> parsed out of a string is inert. Rebuild each one so the browser runs it, and
    // insert them one at a time: an inline script runs the moment it lands in the document, so a
    // snippet pairing a loader with an inline call into it (Mailchimp, Eventbrite) needs the loader
    // to have finished first. `async = false` alone only orders the external scripts against each
    // other — under the HTML parser a blocking external script also held back the inline ones.
    let cancelled = false

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
              script.onload = () => resolve()
              // A provider CDN that 404s shouldn't strand the rest of the snippet.
              script.onerror = () => resolve()
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
      container.replaceChildren()
    }
  }, [html, scopeId])

  return (
    <div className={cn(bgColorClass, textColor)}>
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

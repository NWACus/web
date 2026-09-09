'use client'

import { EmbedLayout } from '@/components/EmbedFrame/EmbedLayout'
import { BASE_ADD_ATTR } from '@/components/EmbedFrame/policies'
import { sanitizeEmbedFragment } from '@/components/EmbedFrame/sanitize'
import type { FormEmbedBlock as FormEmbedBlockProps } from '@/payload-types'
import { useEffect, useId, useRef } from 'react'

type Props = FormEmbedBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

// Sanitize policy for form/donation provider snippets. Unlike the generic and video embeds there is
// no sandbox: this block renders into the page, because checkout SDKs need a rewritable document
// URL and a full-viewport overlay. `script` is in the allowlist, so DOMPurify is not a boundary
// here — who may edit content holding this block is. See docs/decisions/017-form-embeds-in-page.md.
export const FORM_EMBED_POLICY = {
  addTags: ['iframe', 'script', 'style', 'dbox-widget'],
  addAttr: [...BASE_ADD_ATTR, 'allowpaymentrequest', 'campaign', 'classy', 'enable-auto-scroll'],
}

// A hung CDN fires neither `load` nor `error` until the network layer gives up, which is far longer
// than a donor will wait for the scripts queued behind it.
const SCRIPT_LOAD_TIMEOUT_MS = 10_000

// Matches the run of `@charset`/`@import` statements at the very start of a stylesheet, along with
// any whitespace and comments between them.
const LEADING_AT_RULES = /^(?:\s+|\/\*[\s\S]*?\*\/|@(?:charset|import)\b[^;]*;)+/i

// Restores what Tailwind's Preflight resets, for form controls inside the embed only. Element
// selectors beat Preflight's `*` and lose to the provider's own `#id`-based rules.
const controlReset = (scopeId: string) =>
  `@scope ([data-form-embed="${scopeId}"]) {\n` +
  `input, select, textarea, button { border: revert; padding: revert; background-color: revert; background-image: revert; }\n` +
  `}`

// Confines each provider <style> to this embed, so a bare `html, body { … }` rule — which the
// Mailchimp footer snippets ship — cannot restyle the rest of the site. `@charset`/`@import` are
// only legal at the top of a stylesheet, so a leading run of them is hoisted back out.
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
  backgroundColor,
  alignContent,
  className,
  isLayoutBlock,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  // Identifies this embed's subtree so its CSS can be scoped to it. React's useId wraps the value
  // in punctuation that is awkward inside a selector, so keep only the alphanumeric part.
  const scopeId = useId().replace(/[^a-zA-Z0-9]/g, '')

  useEffect(() => {
    const container = containerRef.current
    if (!container || !html) return

    const fragment = sanitizeEmbedFragment(html, FORM_EMBED_POLICY)

    scopeStyles(fragment, scopeId)
    container.appendChild(fragment)

    // A <script> parsed out of a string is inert, so each one is rebuilt as a fresh element. They
    // go in one at a time: an inline script runs the moment it lands, so a snippet pairing a loader
    // with an inline call into it (Mailchimp, Eventbrite) needs the loader to have finished first.
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
              // neither should an unmount landing while the wait is still open.
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

    // Only our own nodes come back out; the provider's globals and anything it appended to
    // document.body stay for the life of the page.
    return () => {
      cancelled = true
      releasePending?.()
      container.replaceChildren()
    }
  }, [html, scopeId])

  // Without this the wrapper's own padding leaves a band of blank space on a page whose embed code
  // has not been filled in yet.
  if (!html) return null

  return (
    <EmbedLayout
      backgroundColor={backgroundColor}
      alignContent={alignContent}
      isLayoutBlock={isLayoutBlock}
      className={className}
    >
      <style>{controlReset(scopeId)}</style>
      <div ref={containerRef} data-form-embed={scopeId} className="w-full" />
    </EmbedLayout>
  )
}

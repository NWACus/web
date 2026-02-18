'use client'

import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import { IframeResizer } from '@open-iframe-resizer/react'
import DOMPurify from 'isomorphic-dompurify'
import { useEffect, useState } from 'react'
import type { GenericEmbedBlock as GenericEmbedBlockProps } from 'src/payload-types'

type Props = GenericEmbedBlockProps & {
  isLexical: boolean
  className?: string
}

export const GenericEmbedBlockComponent = ({
  id,
  html,
  backgroundColor,
  alignContent = 'left',
  className,
  isLexical = true,
}: Props) => {
  const [sanitizedHtml, setSanitizedHtml] = useState<string | null>(null)

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  useEffect(() => {
    if (typeof window === 'undefined' || !html) return

    // Normalize problematic quotes that are parsed incorrectly by DOMParser and DOMPurify
    const normalizedHTML = html.replaceAll('"', '"').replaceAll('"', '"')

    // Convert external module scripts to dynamic imports inside inline classic scripts.
    // Chrome does not re-execute <script type="module" src="..."> in srcDoc iframes
    // after client-side navigation. Inline classic scripts always execute, and dynamic
    // import() bypasses Chrome's per-URL module evaluation cache.
    DOMPurify.addHook('uponSanitizeElement', (node, data) => {
      if (data.tagName === 'script' && node instanceof Element) {
        const src = node.getAttribute('src')
        if (node.getAttribute('type') === 'module' && src) {
          node.removeAttribute('type')
          node.removeAttribute('src')
          node.removeAttribute('async')
          node.textContent = `import(${JSON.stringify(src)});`
        }
      }
    })

    const sanitized = DOMPurify.sanitize(normalizedHTML, {
      ADD_TAGS: ['iframe', 'script', 'style', 'dbox-widget'],
      ADD_ATTR: [
        'allow',
        'allowfullscreen',
        'allowpaymentrequest',
        'async',
        'campaign',
        'enable-auto-scroll',
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
      ],
      FORCE_BODY: true,
    })

    DOMPurify.removeHook('uponSanitizeElement')

    const styleOverrides = `
      <style>
        html, body {
          margin: 0;
          padding: 0;
        }
        iframe {
          border: 0
        }
      </style>
    `

    setSanitizedHtml(sanitized + styleOverrides)
  }, [html])

  if (sanitizedHtml === null) return null

  return (
    <div className={cn(bgColorClass, textColor)}>
      <div
        className={cn(
          isLexical && 'container py-10',
          'flex flex-col',
          alignContent === 'left' && 'items-start',
          alignContent === 'center' && 'items-center',
          alignContent === 'right' && 'items-end',
          className,
        )}
      >
        <IframeResizer
          id={String(id)}
          title={`Embedded content ${id}`}
          srcDoc={sanitizedHtml}
          sandbox="allow-scripts allow-presentation allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="w-full border-none m-0 p-0 transition-[height] duration-200 ease-in-out"
          height={0} // This iframe will resize to it's content height - this initial height is to avoid the iframe rendering at the browser default 150px initially
        />
      </div>
    </div>
  )
}

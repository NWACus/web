'use client'

import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import { IframeResizer } from '@open-iframe-resizer/react'
import DOMPurify from 'dompurify'
import { useEffect, useState } from 'react'
import type { GenericEmbedBlock as GenericEmbedBlockProps } from 'src/payload-types'

type Props = GenericEmbedBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

type IframeContent = { type: 'srcDoc'; value: string } | { type: 'src'; value: string }

export const GenericEmbedBlockComponent = ({
  id,
  html,
  backgroundColor,
  alignContent = 'left',
  className,
  isLayoutBlock = true,
}: Props) => {
  const [iframeContent, setIframeContent] = useState<IframeContent | null>(null)

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  useEffect(() => {
    if (typeof window === 'undefined' || !html) return

    // Normalize problematic quotes that are parsed incorrectly by DOMParser and DOMPurify
    const normalizedHTML = html.replaceAll('\u201C', '"').replaceAll('\u201D', '"')

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

    const fullHtml = `<!DOCTYPE html><html><head></head><body>${sanitized}${styleOverrides}</body></html>`

    // Use a blob URL for embeds with <script> tags because Chromium doesn't re-execute
    // scripts in srcDoc iframes after SPA client-side navigation (renderer-process MemoryCache).
    // Use srcDoc for script-free embeds (e.g. YouTube iframes) so the embedding context is
    // preserved — blob: URLs can cause third-party players to fail their origin/referrer checks.
    if (/<script/i.test(sanitized)) {
      const blob = new Blob([fullHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      setIframeContent({ type: 'src', value: url })
      return () => URL.revokeObjectURL(url)
    } else {
      setIframeContent({ type: 'srcDoc', value: fullHtml })
    }
  }, [html])

  if (iframeContent === null) return null

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
        <IframeResizer
          id={String(id)}
          title={`Embedded content ${id}`}
          {...(iframeContent.type === 'src'
            ? { src: iframeContent.value }
            : { srcDoc: iframeContent.value })}
          sandbox="allow-scripts allow-presentation allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="w-full border-none m-0 p-0 transition-[height] duration-200 ease-in-out"
          height={0} // This iframe will resize to its content height - this initial height avoids the browser default 150px
        />
      </div>
    </div>
  )
}

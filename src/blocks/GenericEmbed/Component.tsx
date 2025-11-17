'use client'

import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import DOMPurify from 'isomorphic-dompurify'
import { useEffect, useState } from 'react'
import type { GenericEmbedBlock as GenericEmbedBlockProps } from 'src/payload-types'

type Props = GenericEmbedBlockProps & {
  className?: string
  wrapInContainer?: boolean
}

export const GenericEmbedBlock = ({
  id,
  html,
  backgroundColor,
  alignContent = 'left',
  className,
  wrapInContainer = true,
}: Props) => {
  const [sanitizedHtml, setSanitizedHtml] = useState<string | null>(null)
  const [shouldBeIframe, setShouldBeIFrame] = useState(false)
  const [iframeHeight, setIframeHeight] = useState<number | string>('auto')

  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  useEffect(() => {
    if (typeof window === 'undefined' || !html) return

    // Normalize problematic quotes that are parsed incorrectly by DOMParser and DOMPurify
    const normalizedHTML = html.replaceAll('“', '"').replaceAll('”', '"')

    const sanitized = DOMPurify.sanitize(normalizedHTML, {
      ADD_TAGS: ['iframe', 'script', 'style'],
      ADD_ATTR: [
        'allow',
        'allowfullscreen',
        'frameborder',
        'scrolling',
        'sandbox',
        'style',
        'title',
        'name',
        'src',
        'height',
        'id',
        'allowpaymentrequest',
      ],
    })

    const parser = new DOMParser()
    const doc = parser.parseFromString(sanitized, 'text/html')

    const scripts = Array.from(doc.querySelectorAll('script'))
    const iframes = Array.from(doc.querySelectorAll('iframe'))

    if (scripts.length > 0 && !(iframes.length > 0)) {
      setShouldBeIFrame(true)
    }

    setSanitizedHtml(doc.body.innerHTML)
  }, [html, id])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'embed-resize' && event.data?.id === id) {
        const newHeight = event.data.height
        if (newHeight && typeof newHeight === 'number') {
          setIframeHeight(newHeight)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [id])

  if (sanitizedHtml === null) return null

  return (
    <div className={cn(bgColorClass, textColor)}>
      <div
        className={cn(
          wrapInContainer && 'container py-10',
          'flex flex-col',
          alignContent === 'left' && 'items-start',
          alignContent === 'center' && 'items-center',
          alignContent === 'right' && 'items-end',
          className,
        )}
        style={{
          height: shouldBeIframe ? iframeHeight : undefined,
        }}
      >
        {shouldBeIframe ? (
          <iframe
            id={String(id)}
            title={`Embedded content ${id}`}
            srcDoc={sanitizedHtml}
            sandbox="allow-scripts allow-forms allow-same-origin"
            className="w-full border-none m-0 overflow-x-clip"
            style={{
              height: iframeHeight,
            }}
          />
        ) : (
          <div
            className={cn(
              'prose max-w-none md:prose-md dark:prose-invert w-full',
              'flex flex-col',
              alignContent === 'left' && 'items-start',
              alignContent === 'center' && 'items-center',
              alignContent === 'right' && 'items-end',
              'overflow-x-clip',
            )}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        )}
      </div>
    </div>
  )
}

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
  className,
  wrapInContainer = true,
}: Props) => {
  const [sanitizedHtml, setSanitizedHtml] = useState<string | null>(null)
  const [shouldBeIframe, setShouldBeIFrame] = useState(false)
  const [iframeHeight, setIframeHeight] = useState<number>(600)

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

    const resizeScript = `
    <style>
      html, body {
      margin: 0;
      padding: 0;
      }
    </style>
      <script>
        function sendHeight() {
          try {
            var height = document.body.scrollHeight || document.documentElement.scrollHeight;
            if (height && height > 0) {
              parent.postMessage({ type: 'embed-resize', id:'${id}', height: height }, '*');
            }
          } catch (error) {
            console.error('Failed to send height:', error);
          }
        }

        function waitForContent() {
          var retries = 0;
          var maxRetries = 50; // 5 seconds max
          var checkInterval = 100;

          function check() {
            try {
              var currentHeight = document.body.scrollHeight || document.documentElement.scrollHeight;
              if (currentHeight > 0) {
                sendHeight();
                return;
              }

              retries++;
              if (retries < maxRetries) {
                setTimeout(check, checkInterval);
              } else {
                // Fallback after max retries
                sendHeight();
              }
            } catch (error) {
              console.error('Content check failed:', error);
              sendHeight(); // Send anyway as fallback
            }
          }

          check();
        }

        window.addEventListener('load', sendHeight);
        window.addEventListener('resize', sendHeight);

        // Dynamic content loading detection
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', waitForContent);
        } else {
          waitForContent();
        }
      </script>
    `

    setSanitizedHtml(doc.body.innerHTML + resizeScript)
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
          wrapInContainer && 'container py-16',
          'max-w-none mx-auto prose md:prose-md dark:prose-invert',
          className,
        )}
        style={{ height: shouldBeIframe ? iframeHeight : undefined }}
      >
        {shouldBeIframe ? (
          <iframe
            id={String(id)}
            title={`Embedded content ${id}`}
            srcDoc={sanitizedHtml}
            sandbox="allow-scripts allow-forms allow-same-origin"
            style={{
              width: '100%',
              height: iframeHeight,
              border: 'none',
              margin: 0,
            }}
          />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        )}
      </div>
    </div>
  )
}

'use client'

import getTextColorFromBgColor from '@/utilities/getTextColorFromBgColor'
import { cn } from '@/utilities/ui'
import { IframeResizer } from '@open-iframe-resizer/react'
import DOMPurify from 'dompurify'
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { GenericEmbedBlock as GenericEmbedBlockProps } from 'src/payload-types'

type Props = GenericEmbedBlockProps & {
  isLayoutBlock: boolean
  className?: string
}

const STYLE_OVERRIDES = `
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

// useSyncExternalStore lets us safely read browser-only output (DOMPurify) on
// the client without a hydration guard. The "store" is the html prop; the
// snapshot is the sanitized markup. Empty subscribe is correct because the
// only thing that changes the value is React re-rendering with a new prop.
const subscribeToNothing = () => () => {}

function buildFullHtml(html: string | null | undefined): string | null {
  if (typeof window === 'undefined' || !html) return null
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
  return `<!DOCTYPE html><html><head></head><body>${sanitized}${STYLE_OVERRIDES}</body></html>`
}

// Sub-component that owns the blob URL via useMemo + cleanup effect, so the
// outer component doesn't need state to track URL lifecycle. `key={fullHtml}`
// on the caller forces remount when content changes, simplifying things.
type IframeProps = React.ComponentProps<typeof IframeResizer>
const BlobIframe = ({
  fullHtml,
  ...iframeProps
}: { fullHtml: string } & Omit<IframeProps, 'src' | 'srcDoc'>) => {
  const url = useMemo(
    () => URL.createObjectURL(new Blob([fullHtml], { type: 'text/html' })),
    [fullHtml],
  )
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return <IframeResizer src={url} {...iframeProps} />
}

export const GenericEmbedBlockComponent = ({
  id,
  html,
  backgroundColor,
  alignContent = 'left',
  className,
  isLayoutBlock = true,
}: Props) => {
  const bgColorClass = `bg-${backgroundColor}`
  const textColor = getTextColorFromBgColor(backgroundColor)

  // Server snapshot is null so SSR renders nothing for this block. Hydration
  // is consistent because the first client render also commits to null, then
  // re-renders with the computed value once subscribeToNothing's snapshot
  // refreshes (which happens because the prop dependency triggers re-render).
  const fullHtml = useSyncExternalStore(
    subscribeToNothing,
    () => buildFullHtml(html),
    () => null,
  )

  if (!fullHtml) return null

  // Use a blob URL for embeds with <script> tags because Chromium doesn't re-execute
  // scripts in srcDoc iframes after SPA client-side navigation (renderer-process MemoryCache).
  // Use srcDoc for script-free embeds (e.g. YouTube iframes) so the embedding context is
  // preserved — blob: URLs can cause third-party players to fail their origin/referrer checks.
  const needsBlob = /<script/i.test(fullHtml)

  const sharedProps = {
    id: String(id),
    title: `Embedded content ${id}`,
    sandbox:
      'allow-scripts allow-presentation allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox',
    className: 'w-full border-none m-0 p-0 transition-[height] duration-200 ease-in-out',
    // This iframe will resize to its content height - the initial height avoids the browser default 150px
    height: 0,
  }

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
        {needsBlob ? (
          <BlobIframe key={fullHtml} fullHtml={fullHtml} {...sharedProps} />
        ) : (
          <IframeResizer srcDoc={fullHtml} {...sharedProps} />
        )}
      </div>
    </div>
  )
}

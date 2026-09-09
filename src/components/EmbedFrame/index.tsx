'use client'

import { EmbedLayout } from '@/components/EmbedFrame/EmbedLayout'
import { sanitizeEmbedHtml } from '@/components/EmbedFrame/sanitize'
import { IframeResizer } from '@open-iframe-resizer/react'
import { useEffect, useState } from 'react'

type IframeContent = { type: 'srcDoc'; value: string } | { type: 'src'; value: string }

export type EmbedFrameProps = {
  id?: number | string | null
  html?: string | null
  backgroundColor?: string
  alignContent?: 'left' | 'center' | 'right' | null
  className?: string
  isLayoutBlock?: boolean
  /** Extra tags DOMPurify keeps — this embed's security policy. */
  addTags: string[]
  /** Extra attributes DOMPurify keeps. */
  addAttr: string[]
  /** Iframe sandbox policy for this embed type. */
  sandbox: string
}

// Shared sandboxed renderer. Each embed block supplies its own sanitize policy
// (addTags/addAttr) and sandbox, keeping the security boundary explicit per block type.
export const EmbedFrame = ({
  id,
  html,
  backgroundColor,
  alignContent,
  className,
  isLayoutBlock,
  addTags,
  addAttr,
  sandbox,
}: EmbedFrameProps) => {
  const [iframeContent, setIframeContent] = useState<IframeContent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !html) return

    const sanitized = sanitizeEmbedHtml(html, { addTags, addAttr })

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

    // Scripts: use a blob URL — Chromium won't re-execute srcDoc scripts after SPA navigation.
    // Script-free (e.g. YouTube): use srcDoc — blob: URLs can fail players' origin/referrer checks.
    if (/<script/i.test(sanitized)) {
      const blob = new Blob([fullHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      setIframeContent({ type: 'src', value: url })
      return () => URL.revokeObjectURL(url)
    } else {
      setIframeContent({ type: 'srcDoc', value: fullHtml })
    }
  }, [html, addTags, addAttr])

  if (iframeContent === null) return null

  return (
    <EmbedLayout
      backgroundColor={backgroundColor}
      alignContent={alignContent}
      isLayoutBlock={isLayoutBlock}
      className={className}
    >
      <IframeResizer
        id={String(id)}
        title={`Embedded content ${id}`}
        {...(iframeContent.type === 'src'
          ? { src: iframeContent.value }
          : { srcDoc: iframeContent.value })}
        sandbox={sandbox}
        className="w-full border-none m-0 p-0 transition-[height] duration-200 ease-in-out"
        height={0} // Resizes to content height; 0 avoids the browser default 150px
      />
    </EmbedLayout>
  )
}

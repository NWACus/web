'use client'

import { useRef } from 'react'

import { AuthoredHtml } from '@/components/forecast/AuthoredHtml'

import { useGlossaryMarks } from './Glossary.client'

/**
 * Already-sanitized forecast HTML with glossary terms marked once they load. Renders exactly as a
 * plain `dangerouslySetInnerHTML` div on the server and without JS; outside a GlossaryProvider it
 * stays that way.
 */
export function GlossaryProse({ html, className }: { html: string; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  useGlossaryMarks(rootRef, html)
  return <AuthoredHtml html={html} className={className} containerRef={rootRef} />
}

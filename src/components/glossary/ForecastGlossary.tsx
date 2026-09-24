import type { ReactNode } from 'react'

import { isGlossaryEnabled } from '@/services/glossary/glossaryEnabled'
import type { AvalancheCenter } from '@/services/nac/types/schemas'

import { GlossaryProvider } from './Glossary.client'

/**
 * Glossary tooltips for the product inside, when the center has them turned on. Off, the client
 * island never mounts and the term list is never fetched.
 */
export function ForecastGlossary({
  center,
  children,
}: {
  center: Pick<AvalancheCenter, 'widget_config'>
  children: ReactNode
}) {
  return isGlossaryEnabled(center) ? <GlossaryProvider>{children}</GlossaryProvider> : children
}

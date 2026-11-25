'use client'

/**
 * PROTOTYPE ONLY — picks the variant before any Mapbox code loads: the legacy-widget variant must
 * not share a page with `@mapbox/search-js-web` (see SkinnyWidgets), and Mapbox can't be
 * server-rendered (see DangerMapLoader).
 */
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { Suspense, type ComponentProps } from 'react'

import { PrototypeSwitcher } from '../../PrototypeSwitcher.client'
import type { DangerMapPrototype as Prototype } from './DangerMapPrototype.client'
import { SkinnyWidgetsVariant } from './SkinnyWidgets.client'
import { VARIANTS } from './variantKeys'

const DangerMapPrototype = dynamic(
  () => import('./DangerMapPrototype.client').then((mod) => mod.DangerMapPrototype),
  { ssr: false },
)

type Props = ComponentProps<typeof Prototype>

function Picker(props: Props) {
  if (useSearchParams().get('variant') !== 'skinny-widgets')
    return <DangerMapPrototype {...props} />
  return (
    <>
      <SkinnyWidgetsVariant centerSlug={props.centerSlug} />
      <PrototypeSwitcher variants={[...VARIANTS]} current="skinny-widgets" />
    </>
  )
}

export function DangerMapPrototypeLoader(props: Props) {
  return (
    <Suspense fallback={null}>
      <Picker {...props} />
    </Suspense>
  )
}

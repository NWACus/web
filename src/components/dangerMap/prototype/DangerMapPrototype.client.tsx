'use client'

/**
 * PROTOTYPE ONLY — issue #1312. Danger-map variants on the real home page, switched with
 * `?variant=` (dev builds only; see HomeDangerMap). Delete this folder once a variant wins.
 */
import { Suspense, useMemo } from 'react'

import type { DangerMapSettings } from '@/services/nac/dangerMap/dangerMapSettings'

import { PrototypeSwitcher, usePrototypeParam } from '../../PrototypeSwitcher.client'
import { useZoneData } from '../useDangerMap'
import { withSampleRatings } from './sampleRatings'
import { isVariantKey, VARIANTS, type VariantKey } from './variantKeys'
import {
  CentersVariant,
  CurrentVariant,
  GuideVariant,
  SkinnyVariant,
  TerrainVariant,
  TiltVariant,
  type VariantProps,
} from './variants'

const COMPONENTS: Record<VariantKey, React.ComponentType<VariantProps>> = {
  current: CurrentVariant,
  tilt: TiltVariant,
  terrain: TerrainVariant,
  guide: GuideVariant,
  centers: CentersVariant,
  skinny: SkinnyVariant,
  'skinny-widgets': () => null,
}

interface DangerMapPrototypeProps {
  centerSlug: string
  centerId: string
  settings: DangerMapSettings
}

function DangerMapPrototypeInner({ centerSlug, centerId, settings }: DangerMapPrototypeProps) {
  const { searchParams, setParam } = usePrototypeParam()
  const requested = searchParams.get('variant')
  const variantKey: VariantKey = isVariantKey(requested) ? requested : 'current'
  const variant = VARIANTS.find((entry) => entry.key === variantKey) ?? VARIANTS[0]

  const sample = searchParams.get('ratings') !== 'live'
  const othersParam = searchParams.get('others')
  const allCenters =
    variantKey === 'centers'
      ? true
      : othersParam
        ? othersParam === 'on'
        : (variant.othersByDefault ?? settings.allCenters)

  const effectiveSettings = useMemo(() => ({ ...settings, allCenters }), [settings, allCenters])
  const { zones: liveZones } = useZoneData(centerSlug, allCenters)
  const zones = useMemo(
    () => (sample ? withSampleRatings(liveZones) : liveZones),
    [sample, liveZones],
  )

  const Variant = COMPONENTS[variantKey]

  return (
    <>
      <Variant
        key={`${variantKey}-${allCenters}`}
        zones={zones}
        centerId={centerId}
        settings={effectiveSettings}
      />
      <PrototypeSwitcher variants={[...VARIANTS]} current={variantKey}>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={sample}
            onChange={(event) => setParam('ratings', event.target.checked ? null : 'live')}
          />
          Sample ratings
        </label>
        <label
          className={`flex items-center gap-1.5 text-xs ${variantKey === 'centers' ? 'opacity-40' : 'cursor-pointer'}`}
        >
          <input
            type="checkbox"
            checked={allCenters}
            disabled={variantKey === 'centers'}
            onChange={(event) => setParam('others', event.target.checked ? 'on' : 'off')}
          />
          Other centers
        </label>
      </PrototypeSwitcher>
    </>
  )
}

export function DangerMapPrototype(props: DangerMapPrototypeProps) {
  return (
    <Suspense fallback={null}>
      <DangerMapPrototypeInner {...props} />
    </Suspense>
  )
}

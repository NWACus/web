/**
 * The card a marker shows on hover (or tap, on a phone): what the widget's popup shows, from the
 * tile feature's own properties. React-rendered — the widget built this as an HTML string with the
 * submitter's location name interpolated into it unescaped.
 */
import { Calendar, Compass, Hash, Layers, MapPin, Mountain, Users, Zap } from 'lucide-react'
import type { ReactNode } from 'react'

import { triggerGroupOf } from '@/services/nac/observations/options'

import { capitalize } from '../format'

export type MarkerProperties = Record<string, unknown>

/** A string property, or null for absent and blank. Tile properties carry no nulls of their own. */
function text(properties: MarkerProperties, key: string): string | null {
  const value = properties[key]
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function numberOf(properties: MarkerProperties, key: string): number | null {
  const value = properties[key]
  return typeof value === 'number' ? value : null
}

function Detail({
  icon,
  children,
  wide,
}: {
  icon: ReactNode
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-1 text-[0.8125rem] leading-snug ${wide ? 'col-span-2' : ''}`}
    >
      <span className="shrink-0 text-primary" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/** A detail row only when there is a value for it. */
function OptionalDetail({
  icon,
  value,
  wide,
}: {
  icon: ReactNode
  value: string | null
  wide?: boolean
}) {
  if (!value) return null
  return (
    <Detail icon={icon} wide={wide}>
      {value}
    </Detail>
  )
}

function PopupBadge({
  shown,
  className,
  children,
}: {
  shown: boolean
  className: string
  children: ReactNode
}) {
  if (!shown) return null
  return <span className={`rounded-full px-2 text-xs font-bold ${className}`}>{children}</span>
}

function crackingOrCollapsing(properties: MarkerProperties): boolean {
  return properties.cracking === true || properties.collapsing === true
}

function Badges({ properties }: { properties: MarkerProperties }) {
  const avalanches = properties.avalanches_observed === true
  const instability = crackingOrCollapsing(properties)
  if (!avalanches && !instability) return null
  return (
    <div className="flex flex-wrap gap-1 px-3 pt-2">
      <PopupBadge shown={avalanches} className="bg-red-100 text-red-700">
        Avalanches Observed
      </PopupBadge>
      <PopupBadge shown={instability} className="bg-orange-100 text-orange-700">
        Collapsing/Cracking
      </PopupBadge>
    </div>
  )
}

function ObservationDetails({ properties }: { properties: MarkerProperties }) {
  return (
    <>
      <Badges properties={properties} />
      <div className="grid grid-cols-2 gap-1 px-3 pt-2">
        <Detail icon={<Calendar className="h-4 w-4" />}>
          {text(properties, 'start_date') ?? 'No date'}
        </Detail>
        <Detail icon={<Users className="h-4 w-4" />}>
          {capitalize(text(properties, 'observer_type') ?? 'public')}
        </Detail>
        <OptionalDetail
          icon={<Users className="h-4 w-4" />}
          value={text(properties, 'organization')}
          wide
        />
        <OptionalDetail
          icon={<MapPin className="h-4 w-4" />}
          value={text(properties, 'zone_name')}
          wide
        />
      </div>
    </>
  )
}

function sizeLabel(properties: MarkerProperties): string {
  const dSize = text(properties, 'd_size')
  return dSize ? `D${dSize}` : 'Unknown'
}

function elevationLabel(properties: MarkerProperties): string | null {
  const elevation = numberOf(properties, 'elevation')
  return elevation === null ? null : `${elevation}ft`
}

function triggerLabel(properties: MarkerProperties): string | null {
  const trigger = text(properties, 'trigger')
  return trigger && (triggerGroupOf(trigger) ?? trigger)
}

function AvalancheDetails({ properties }: { properties: MarkerProperties }) {
  const number = numberOf(properties, 'number')
  return (
    <div className="grid grid-cols-2 gap-1 px-3 pt-2">
      <Detail icon={<Calendar className="h-4 w-4" />}>
        {text(properties, 'date') ?? 'No date'}
      </Detail>
      <Detail icon={<Hash className="h-4 w-4" />}>{number || 1}</Detail>
      <Detail icon={<Layers className="h-4 w-4" />}>{sizeLabel(properties)}</Detail>
      <OptionalDetail icon={<Compass className="h-4 w-4" />} value={text(properties, 'aspect')} />
      <OptionalDetail icon={<Mountain className="h-4 w-4" />} value={elevationLabel(properties)} />
      <OptionalDetail icon={<Zap className="h-4 w-4" />} value={triggerLabel(properties)} />
    </div>
  )
}

function OpenLink({
  kind,
  href,
  onOpen,
}: {
  kind: MarkerPopupProps['kind']
  href: string | null
  onOpen: () => void
}) {
  if (!href) return <em className="text-[0.8125rem] text-neutral-500">Click marker to view</em>
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault()
        onOpen()
      }}
      className="mt-1 block rounded border px-2 py-1 text-center text-sm font-medium hover:bg-neutral-100"
    >
      View {kind === 'observation' ? 'Observation' : 'Avalanche'}
    </a>
  )
}

interface MarkerPopupProps {
  kind: 'observation' | 'avalanche'
  properties: MarkerProperties
  /** On a phone a tap opens this card, so it carries the link a desktop click would follow. */
  href: string | null
  onOpen: () => void
}

const FALLBACK_TITLES = { observation: 'Observation', avalanche: 'Avalanche Observation' }

export function MarkerPopup({ kind, properties, href, onOpen }: MarkerPopupProps) {
  const Details = kind === 'observation' ? ObservationDetails : AvalancheDetails
  return (
    <div className="w-60 overflow-hidden rounded-lg bg-white text-sm text-neutral-900">
      <div className="line-clamp-2 border-b bg-neutral-50 px-3 py-2 text-sm font-semibold uppercase leading-tight">
        {text(properties, 'location_name') ?? FALLBACK_TITLES[kind]}
      </div>
      <Details properties={properties} />
      <div className="px-3 pb-2 pt-1">
        <OpenLink kind={kind} href={href} onOpen={onOpen} />
      </div>
    </div>
  )
}

'use client'

/**
 * A list card, as the widget's `ObservationCard` lays it out: the date and badges across the top;
 * where, and who (or, for an avalanche, how many, aspect, elevation and trigger); and the first
 * photo with a count of all the media. The whole card is a link to the record, so a modified click
 * opens its full page in a new tab while a plain one opens it over the list.
 */
import {
  AlertTriangle,
  Compass,
  FileText,
  Flag,
  Hash,
  Link2,
  MapPin,
  Mountain,
  User,
  Users,
  Zap,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

import { getThumbnailUrl } from '@/components/forecast/mediaItem'
import { MediaType } from '@/services/nac/model/forecast'
import type {
  AvalancheCardData,
  CardData,
  ObservationCardData,
} from '@/services/nac/observations/cards'
import { cn } from '@/utilities/ui'

import { capitalize, formatDay } from '../format'
import { isPlainClick } from '../links'
import { MARKER_COLORS, avalancheColor } from '../map/markerStyle'

export function Badge({
  className,
  style,
  children,
}: {
  className: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 text-xs font-bold',
        className,
      )}
      style={style}
    >
      {children}
    </span>
  )
}

export function AvalanchesObservedBadge({ text = 'Avalanches Observed' }: { text?: string }) {
  return (
    <Badge className="bg-red-100 text-red-700">
      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
      {text}
    </Badge>
  )
}

export function InstabilityBadge({ text = 'Collapsing/Cracking' }: { text?: string }) {
  return (
    <Badge className="bg-orange-100 text-orange-700">
      <Flag className="h-3 w-3" aria-hidden="true" />
      {text}
    </Badge>
  )
}

/** Colored as the map colors the marker; D1's yellow takes dark text. */
export function SizeBadge({ dSize }: { dSize: string | null }) {
  if (!dSize) return null
  const color = avalancheColor(dSize)
  return (
    <Badge
      className={color === MARKER_COLORS.d1 ? 'text-neutral-900' : 'text-white'}
      style={{ backgroundColor: color }}
    >
      D{dSize}
    </Badge>
  )
}

function HumanTriggerBadge() {
  return (
    <Badge className="bg-red-100 text-red-700">
      <User className="h-3 w-3" aria-hidden="true" />
      Human
    </Badge>
  )
}

function Line({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground" aria-hidden="true">
        {icon}
      </span>
      {children}
    </div>
  )
}

function ThumbnailImage({ item }: { item: NonNullable<CardData['media']['thumbnail']> }) {
  const url = getThumbnailUrl(item)
  const Icon = item.type === MediaType.PDF ? FileText : Link2
  if (!url) return <Icon className="m-auto mt-6 h-8 w-8 text-muted-foreground" aria-hidden="true" />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
}

function Thumbnail({ media }: { media: CardData['media'] }) {
  if (!media.thumbnail) return null
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-muted">
      <ThumbnailImage item={media.thumbnail} />
      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-xs text-white">
        {media.count}
        <span className="sr-only"> media</span>
      </span>
    </div>
  )
}

function Organization({ name }: { name: string | null }) {
  if (!name) return null
  return (
    <>
      <Users className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>{name}</span>
    </>
  )
}

function ObservationBody({ card }: { card: ObservationCardData }) {
  return (
    <Line icon={<User className="h-4 w-4" />}>
      <span>{capitalize(card.observerType)}</span>
      <Organization name={card.organization} />
    </Line>
  )
}

function AvalancheBody({ card }: { card: AvalancheCardData }) {
  const facts: [ReactNode, string | number | null][] = [
    [<Hash key="n" className="h-4 w-4" />, card.number],
    [<Compass key="a" className="h-4 w-4" />, card.aspect],
    [
      <Mountain key="e" className="h-4 w-4" />,
      card.elevation === null ? null : `${card.elevation}ft`,
    ],
    [<Zap key="t" className="h-4 w-4" />, card.trigger],
  ]
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {facts.map(([icon, value], index) => (
        <Line key={index} icon={icon}>
          {value ?? ''}
        </Line>
      ))}
    </div>
  )
}

function ObservationBadges({ card }: { card: ObservationCardData }) {
  return (
    <>
      {card.avalanchesObserved && <AvalanchesObservedBadge />}
      {card.crackingOrCollapsing && <InstabilityBadge />}
    </>
  )
}

function AvalancheBadges({ card }: { card: AvalancheCardData }) {
  return (
    <>
      {card.trigger === 'Human' && <HumanTriggerBadge />}
      <SizeBadge dSize={card.dSize} />
    </>
  )
}

function Where({ card }: { card: CardData }) {
  return (
    <Line icon={<MapPin className="h-4 w-4" />}>
      <span className="min-w-0">
        <span className="block">{card.locationName}</span>
        {card.zoneName && <span className="block font-bold">{card.zoneName}</span>}
      </span>
    </Line>
  )
}

function Badges({ card }: { card: CardData }) {
  return card.kind === 'observation' ? (
    <ObservationBadges card={card} />
  ) : (
    <AvalancheBadges card={card} />
  )
}

function Body({ card }: { card: CardData }) {
  return card.kind === 'observation' ? (
    <ObservationBody card={card} />
  ) : (
    <AvalancheBody card={card} />
  )
}

function CardHeader({ card }: { card: CardData }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted px-3 py-2">
      <span className="font-semibold">{formatDay(card.date)}</span>
      <span className="flex flex-wrap gap-1">
        <Badges card={card} />
      </span>
    </div>
  )
}

function CardContent({ card }: { card: CardData }) {
  return (
    <>
      <CardHeader card={card} />
      <div className="flex gap-3 px-3 py-2">
        <div className="flex min-w-0 grow flex-col gap-1">
          <Where card={card} />
          <Body card={card} />
        </div>
        <Thumbnail media={card.media} />
      </div>
    </>
  )
}

interface ObservationCardProps {
  card: CardData
  href: string
  highlighted: boolean
  /** Open over the list; without it the card is a plain link, as on a record's own page. */
  onOpen?: () => void
  onHighlight?: (id: string | null) => void
}

export function ObservationCard({
  card,
  href,
  highlighted,
  onOpen,
  onHighlight,
}: ObservationCardProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        if (!onOpen || !isPlainClick(event)) return
        event.preventDefault()
        onOpen()
      }}
      onMouseEnter={() => onHighlight?.(card.id)}
      onMouseLeave={() => onHighlight?.(null)}
      className={cn(
        'block overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        highlighted && 'border-primary',
      )}
      data-testid={`${card.kind}-card`}
    >
      <CardContent card={card} />
    </a>
  )
}

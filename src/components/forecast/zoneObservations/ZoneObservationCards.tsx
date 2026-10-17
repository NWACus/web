/**
 * The widget's observation and avalanche cards (`ObservationCard.vue`): date and signs in the
 * header, location and details with icons, and a thumbnail with the media count. Each card links
 * to the record's own page.
 */
import type {
  MediaThumbnail,
  ZoneAvalanche,
  ZoneObservation,
} from '@/services/nac/model/zoneObservations'
import { cn } from '@/utilities/ui'
import {
  CircleHelp,
  Compass,
  FileText,
  Flag,
  Hash,
  Link as LinkIcon,
  MapPin,
  Mountain,
  MountainSnow,
  MoveDiagonal,
  SquarePlay,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { cardDate, sizeTone, triggerLabel, type PillTone } from './zoneTabs'

// The widget's Bootstrap colors, as a 20% tint behind full-strength text.
const pillToneClass: Record<PillTone, string> = {
  plain: 'bg-[#e0e2e5] text-[#212529]',
  red: 'bg-[rgba(220,53,69,0.2)] text-[#dc3545]',
  orange: 'bg-[rgba(253,126,20,0.2)] text-[#fd7e14]',
  yellow: 'bg-[rgba(255,193,7,0.2)] text-[#ffc107]',
  black: 'bg-[rgba(0,0,0,0.8)] text-[#e0e2e5]',
}

function Pill({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: PillTone
  icon: LucideIcon
  title?: string
  children: ReactNode
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-[10px] py-0.5 pl-[0.4rem] pr-2 text-[0.8rem] leading-tight',
        pillToneClass[tone],
      )}
    >
      <Icon aria-hidden className="size-[0.8rem]" />
      {children}
    </span>
  )
}

const tileIcon: Record<'pdf' | 'external', LucideIcon> = {
  pdf: FileText,
  external: LinkIcon,
}

function ThumbnailFace({ thumbnail }: { thumbnail: MediaThumbnail }) {
  if (thumbnail.kind === 'unknown') return null
  if (thumbnail.kind === 'pdf' || thumbnail.kind === 'external') {
    const Icon = tileIcon[thumbnail.kind]
    return (
      <span className="flex size-full items-center justify-center rounded-md bg-[#adb0b3]">
        <Icon aria-hidden className="size-10 text-[#212529]" />
      </span>
    )
  }
  return (
    <span className="relative flex size-full items-center justify-center overflow-hidden rounded-md bg-[#adb0b3]">
      {thumbnail.src && (
        // NAC media hosts aren't in next/image's remote patterns; the forecast's media does the same.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail.src} alt="" className="size-full object-cover" loading="lazy" />
      )}
      {thumbnail.kind === 'video' && (
        <SquarePlay aria-hidden className="absolute size-8 text-[#dc3545]" />
      )}
    </span>
  )
}

/**
 * The widget's 90px thumbnail, with its grey media count over the top-right corner. A media type
 * the widget doesn't draw leaves only the count, as in the widget.
 */
function CardThumbnail({ thumbnail, count }: { thumbnail: MediaThumbnail | null; count: number }) {
  if (!thumbnail) return null

  return (
    <span className="relative block size-[90px] shrink-0">
      <ThumbnailFace thumbnail={thumbnail} />
      <span className="absolute -right-[7px] -top-[7px] size-5 rounded-full bg-[#797d80] text-center text-sm font-bold leading-5 text-[#f8f9fb]">
        {count}
        <span className="sr-only"> photos or attachments</span>
      </span>
    </span>
  )
}

function Detail({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon aria-hidden className="size-[1.2rem] shrink-0 text-primary" />
      {children}
    </span>
  )
}

function CardShell({
  href,
  date,
  pills,
  children,
}: {
  href: string
  date: string
  pills: ReactNode
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      // A busy week is dozens of cards, and the record pages render per request.
      prefetch={false}
      className="block overflow-hidden rounded-md border border-[#e0e2e5] bg-background transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#e0e2e5] bg-[#f8f9fb] px-4 py-3">
        <span className="whitespace-nowrap font-bold">{cardDate(date)}</span>
        <span className="flex flex-wrap justify-end gap-1">{pills}</span>
      </div>
      <div className="flex gap-4 p-4">{children}</div>
    </Link>
  )
}

export function ObservationCard({ obs }: { obs: ZoneObservation }) {
  return (
    <CardShell
      href={`/observations/${obs.id}`}
      date={obs.date}
      pills={
        <>
          {obs.avalanchesObserved && (
            <Pill tone="red" icon={MountainSnow} title="Avalanches observed">
              Avalanches Observed
            </Pill>
          )}
          {obs.instability && (
            <Pill tone="orange" icon={Flag} title="Cracking or collapsing observed">
              Collapsing/Cracking
            </Pill>
          )}
        </>
      }
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Detail icon={MapPin}>{obs.location}</Detail>
        <div className="flex flex-wrap gap-x-5 gap-y-2 capitalize">
          <Detail icon={User}>{obs.observerType}</Detail>
          {obs.organization && <Detail icon={Users}>{obs.organization}</Detail>}
        </div>
      </div>
      <CardThumbnail thumbnail={obs.thumbnail} count={obs.mediaCount} />
    </CardShell>
  )
}

export function AvalancheCard({ avy }: { avy: ZoneAvalanche }) {
  const trigger = triggerLabel(avy.trigger)
  return (
    <CardShell
      href={`/observations/avalanches/${avy.id}`}
      date={avy.date}
      pills={
        <>
          {trigger === 'Human' && (
            <Pill tone="red" icon={User}>
              Human
            </Pill>
          )}
          {avy.dSize && (
            <Pill tone={sizeTone(avy.dSize)} icon={MoveDiagonal}>
              D{avy.dSize}
            </Pill>
          )}
        </>
      }
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Detail icon={MapPin}>{avy.location}</Detail>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Detail icon={Hash}>{avy.number}</Detail>
          <Detail icon={Compass}>{avy.aspect}</Detail>
          {/* The widget's unformatted `9000ft`. */}
          <Detail icon={Mountain}>{avy.elevation}ft</Detail>
          <Detail icon={CircleHelp}>{trigger}</Detail>
        </div>
      </div>
      <CardThumbnail thumbnail={avy.thumbnail} count={avy.mediaCount} />
    </CardShell>
  )
}

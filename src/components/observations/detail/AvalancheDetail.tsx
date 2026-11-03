/**
 * An avalanche occurrence, as the widget's `AvySingleView` lays it out: the unverified and
 * forecaster-edited notices, a header of when, where and who beside a small map, the observer's
 * comments, the media, then its characteristics and impacts, and the disclaimer on anything a
 * forecaster didn't write. Same markup on the record's own page and in the modal over the list.
 */
import { Info, ListChecks, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Avalanche, AvalancheImpacts } from '@/services/nac/model/observation'
import {
  AVALANCHE_TYPES,
  BED_SURFACES,
  CAUSE_LABELS,
  TERMINI,
  TRIGGERS,
  WEAK_LAYERS,
  labelFor,
} from '@/services/nac/observations/options'
import { detailPath } from '@/services/nac/observations/routes'

import { formatDay, formatSubmitted, formatTimeOfDay } from '../format'
import { isPlainClick } from '../links'
import { MARKER_COLORS, avalancheColor } from '../map/markerStyle'
import {
  HeaderField,
  Panel,
  RecordTitle,
  ReviewDisclaimer,
  Section,
  TextBlock,
  type DetailTitleTag,
} from './DetailParts'
import type { AvalancheDetailData } from './detailTypes'
import { LocationMap } from './LocationMap.client'
import { MediaGallery } from './MediaGallery'
import { ObserverFields } from './ObservationDetail'

type Row = [string, ReactNode]

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}

function Notices({ avalanche }: { avalanche: Avalanche }) {
  return (
    <div className="flex flex-col gap-2">
      {!avalanche.forecasterVerified && (
        <Notice>This avalanche has not been confirmed by a forecaster.</Notice>
      )}
      {avalanche.forecasterEdited && (
        <Notice>
          This data has been edited by a forecaster. {avalanche.forecasterEditedReason}
        </Notice>
      )}
    </div>
  )
}

const accuracy = (known: boolean) => (known ? 'Exact' : 'Estimated')

/** A value with a unit after it, or null when there is none — a 0 included, as the widget hides it. */
const withUnit = (unit: string) => (value: number | null) => (value ? `${value}${unit}` : null)

/** Slab thickness in centimeters, and in feet to the nearest half foot as the widget rounds it. */
function slabThickness(cm: number | null): string | null {
  return cm ? `${cm} cm (${Math.round(cm * 0.0328084 * 2) / 2} ft)` : null
}

/** The trigger's label, with its modifier on the line below, as the widget shows it. */
function triggerLabel(avalanche: Avalanche): ReactNode {
  const trigger = labelFor(avalanche.trigger, TRIGGERS)
  const cause = labelFor(avalanche.cause, CAUSE_LABELS)
  if (!trigger || !cause) return trigger
  return (
    <>
      {trigger}
      <br />
      {cause}
    </>
  )
}

/** The widget's characteristics, in its order, each as a label and how to read it. */
const CHARACTERISTICS: [string, (avalanche: Avalanche) => ReactNode][] = [
  ['Aspect', (a) => a.aspect],
  ['Aspect Range', (a) => a.aspectRange.join(', ')],
  ['Slope Angle', (a) => withUnit('°')(a.slopeAngle)],
  ['Elevation', (a) => withUnit(' ft')(a.elevation)],
  ['Vertical Fall', (a) => withUnit(' ft')(a.verticalFall)],
  ['Destructive Size', (a) => a.dSize && `D${a.dSize}`],
  ['Relative Size', (a) => a.rSize && `R${a.rSize}`],
  ['Type', (a) => labelFor(a.avalancheType, AVALANCHE_TYPES)],
  ['Problem Type', (a) => a.avalancheProblem],
  ['Bed Surface', (a) => labelFor(a.bedSurface, BED_SURFACES)],
  ['Weak Layer Grain Type', (a) => labelFor(a.weakLayerType, WEAK_LAYERS)],
  ['Weak Layer Burial Date', (a) => a.weakLayerDate && formatDay(a.weakLayerDate)],
  ['Slab Thickness', (a) => slabThickness(a.avgCrownDepth)],
  ['Width', (a) => withUnit(' ft')(a.width)],
  ['Trigger', triggerLabel],
  ['Terminus', (a) => labelFor(a.terminus, TERMINI)],
]

/** "# Avalanches" always (one when unset), then every characteristic the record has. */
export function characteristics(avalanche: Avalanche): Row[] {
  const rows = CHARACTERISTICS.map(([label, read]): Row => [label, read(avalanche)])
  return [['# Avalanches', avalanche.number || 1], ...rows.filter(([, value]) => value)]
}

function Facts({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}:</dt>
          <dd className="text-sm">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

type ImpactRow = [string, keyof AvalancheImpacts]

const IMPACT_GROUPS: { title: string; rows: ImpactRow[] }[] = [
  {
    title: 'Human',
    rows: [
      ['Caught/Carried', 'humansCaught'],
      ['Partly Buried-Not Critical', 'humansPartBuriedNonCritical'],
      ['Partly Buried-Critical', 'humansPartBuriedCritical'],
      ['Completely Buried', 'humansFullyBuried'],
      ['Injured', 'humansInjured'],
      ['Killed', 'humansKilled'],
    ],
  },
  {
    title: 'Vehicle',
    rows: [
      ['Hit', 'vehiclesHit'],
      ['Fully Buried', 'vehiclesFullyBuried'],
      ['Damaged', 'vehiclesDamaged'],
      ['Damage Cost', 'vehiclesDamageCost'],
    ],
  },
  {
    title: 'Structure',
    rows: [
      ['Hit', 'structuresHit'],
      ['Damaged', 'structuresDamaged'],
      ['Destroyed', 'structuresDestroyed'],
      ['Damage Cost', 'structuresDamageCost'],
    ],
  },
]

const MONEY = new Set<keyof AvalancheImpacts>(['vehiclesDamageCost', 'structuresDamageCost'])

/** Each impact group with the counts it has, groups with none left out. */
export function impactGroups(impacts: AvalancheImpacts): { title: string; rows: Row[] }[] {
  return IMPACT_GROUPS.map(({ title, rows }) => ({
    title,
    rows: rows
      .filter(([, key]) => impacts[key] > 0)
      .map(([label, key]): Row => [label, MONEY.has(key) ? `$${impacts[key]}` : impacts[key]]),
  })).filter((group) => group.rows.length > 0)
}

function ImpactsSection({ avalanche }: { avalanche: Avalanche }) {
  const groups = impactGroups(avalanche.impacts)
  if (groups.length === 0 && !avalanche.impactsComments) return null
  return (
    <Section icon={<TriangleAlert className="h-5 w-5" />} title="Impacts">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <h3 className="font-semibold">{group.title}</h3>
          <Facts rows={group.rows} />
        </div>
      ))}
      {avalanche.impactsComments && (
        <div>
          <h3 className="font-semibold">Comments</h3>
          <TextBlock text={avalanche.impactsComments} />
        </div>
      )}
    </Section>
  )
}

function occurrenceTime(avalanche: Avalanche): string {
  if (!avalanche.time) return 'Not Reported'
  return `${formatTimeOfDay(avalanche.time)} (${accuracy(avalanche.timeKnown)})`
}

/** Over the list, a plain click opens the observation in the modal, as the widget's does. */
function AssociatedObservation({
  id,
  prefix,
  onOpen,
}: {
  id: string | null
  prefix: string
  onOpen?: (id: string) => void
}) {
  if (!id) return null
  const href = `${prefix}${detailPath('observation', id)}`
  // Server-rendered on the record's own page, where a handler can't be passed.
  if (!onOpen) {
    return (
      <a href={href} className="underline">
        View Observation
      </a>
    )
  }
  return (
    <a
      href={href}
      className="underline"
      onClick={(event) => {
        if (!isPlainClick(event)) return
        event.preventDefault()
        onOpen(id)
      }}
    >
      View Observation
    </a>
  )
}

interface HeaderProps {
  avalanche: Avalanche
  timezone: string
  prefix: string
  onOpenObservation?: (id: string) => void
}

function HeaderFields({ avalanche, timezone, prefix, onOpenObservation }: HeaderProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <HeaderField title="Occurrence Date">
        {`${formatDay(avalanche.date)} (${accuracy(avalanche.dateKnown)})`}
      </HeaderField>
      <HeaderField title="Occurrence Time">{occurrenceTime(avalanche)}</HeaderField>
      <HeaderField title="Submitted">{formatSubmitted(avalanche.createdAt, timezone)}</HeaderField>
      <HeaderField title="Zone / Region">{avalanche.zone.name ?? 'Other'}</HeaderField>
      <ObserverFields observer={avalanche.observer} />
      <HeaderField title="Observation Date">{formatDay(avalanche.obsDate)}</HeaderField>
      <HeaderField title="Associated Observation">
        <AssociatedObservation
          id={avalanche.observationId}
          prefix={prefix}
          onOpen={onOpenObservation}
        />
      </HeaderField>
    </div>
  )
}

interface AvalancheDetailProps {
  detail: AvalancheDetailData
  timezone: string
  prefix?: string
  /** Open the associated observation over the list; without it the link is a plain link. */
  onOpenObservation?: (id: string) => void
  TitleTag?: DetailTitleTag
}

function Header({ TitleTag, ...props }: HeaderProps & { TitleTag: DetailTitleTag }) {
  const { avalanche } = props
  return (
    <header className="grid gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-3 md:col-span-2">
        <RecordTitle
          TitleTag={TitleTag}
          title="Avalanche Occurrence"
          location={avalanche.locationName}
        />
        <HeaderFields {...props} />
      </div>
      <LocationMap
        location={avalanche.location}
        // The widget keeps an unsized avalanche's pin blue rather than calling it a D1.
        color={avalanche.dSize ? avalancheColor(avalanche.dSize) : MARKER_COLORS.observation}
        label={avalanche.locationName ?? 'the avalanche'}
        count={avalanche.number}
      />
    </header>
  )
}

function Summary({ comments }: { comments: string | null }) {
  if (!comments) return null
  return (
    <Panel>
      <Section icon={<Info className="h-5 w-5" />} title="Avalanche Summary">
        <TextBlock text={comments} />
      </Section>
    </Panel>
  )
}

export function AvalancheDetail({
  detail,
  timezone,
  prefix = '',
  onOpenObservation,
  TitleTag = 'h1',
}: AvalancheDetailProps) {
  const { avalanche } = detail
  return (
    <article className="flex flex-col gap-6" data-testid="avalanche-detail">
      <Notices avalanche={avalanche} />
      <Header
        avalanche={avalanche}
        timezone={timezone}
        prefix={prefix}
        onOpenObservation={onOpenObservation}
        TitleTag={TitleTag}
      />
      <Summary comments={avalanche.comments} />
      <MediaGallery tiles={detail.gallery} lightbox={detail.lightbox} />
      <Panel>
        <Section icon={<ListChecks className="h-5 w-5" />} title="Characteristics">
          <Facts rows={characteristics(avalanche)} />
        </Section>
        <ImpactsSection avalanche={avalanche} />
      </Panel>
      {avalanche.observer.type !== 'forecaster' && <ReviewDisclaimer />}
    </article>
  )
}

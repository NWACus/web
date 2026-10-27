/**
 * An observation, as the widget's `ObsSingleView` lays it out: a header of who, when and where
 * beside a small map, the summary and signs of instability, the media, then the avalanches,
 * weather, snowpack and problems panels the record has anything for, and the disclaimer on
 * anything a forecaster didn't write.
 *
 * Renders from `ObservationDetailData` only, so it is the same markup on the record's own page
 * (server-rendered) and in the modal over the list.
 */
import { ExternalLink } from 'lucide-react'

import type { ObservationObserver } from '@/services/nac/model/observation'
import { ACTIVITIES, labelFor } from '@/services/nac/observations/options'
import { detailPath } from '@/services/nac/observations/routes'

import { capitalize, formatDay, formatHalfHour, formatSubmitted } from '../format'
import { observationColor } from '../map/markerStyle'
import {
  HeaderField,
  LocationMap,
  Panel,
  RecordTitle,
  ReviewDisclaimer,
  type DetailTitleTag,
} from './DetailParts'
import type { ObservationDetailData } from './detailTypes'
import { MediaGallery } from './MediaGallery'
import {
  AvalanchesSection,
  SnowpackSection,
  SummarySection,
  WeatherSection,
  showsAvalanches,
  showsSnowpack,
  showsWeather,
} from './ObservationSections'
import { ProblemsSection, showsProblems } from './ProblemsSection'

type Observation = ObservationDetailData['observation']

function timesInField(observation: Observation): [string, string] | null {
  const { timeInField } = observation
  return timeInField && [formatHalfHour(timeInField.start), formatHalfHour(timeInField.end)]
}

/** "Mar 15, 2026 (7:00 - 12:30)", with the end date and times as the record has them. */
export function observationDateLabel(observation: Observation): string {
  const start = formatDay(observation.startDate)
  const times = timesInField(observation)
  if (!observation.endDate) return times ? `${start} (${times[0]} - ${times[1]})` : start
  const end = formatDay(observation.endDate)
  return times ? `${start} (${times[0]}) - ${end} (${times[1]})` : `${start} - ${end}`
}

function Affiliation({ observer }: { observer: ObservationObserver }) {
  if (!observer.organizationUrl) return observer.organization
  return (
    <a
      href={observer.organizationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 underline"
    >
      {observer.organization}
      <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  )
}

/** Who submitted it: name when shown, type, and affiliation (linked when it has a URL). */
export function ObserverFields({ observer }: { observer: ObservationObserver }) {
  return (
    <>
      <HeaderField title="Observer Name">{observer.name}</HeaderField>
      <HeaderField title="Observer Type">{capitalize(observer.type)}</HeaderField>
      <HeaderField title="Observer Affiliation">
        {observer.organization && <Affiliation observer={observer} />}
      </HeaderField>
    </>
  )
}

function ActivityField({ activity }: { activity: string[] }) {
  if (activity.length === 0) return null
  return (
    <HeaderField title="Activity">
      {activity.map((value) => (
        <div key={value}>{labelFor(value, ACTIVITIES)}</div>
      ))}
    </HeaderField>
  )
}

function HeaderFields({ observation, timezone }: { observation: Observation; timezone: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <HeaderField title="Observation Date">{observationDateLabel(observation)}</HeaderField>
      <HeaderField title="Submitted">
        {formatSubmitted(observation.createdAt, timezone)}
      </HeaderField>
      <HeaderField title="Zone / Region">{observation.zone.name ?? 'Other'}</HeaderField>
      <ObserverFields observer={observation.observer} />
      <ActivityField activity={observation.activity} />
      <HeaderField title="Route" wide>
        {observation.route}
      </HeaderField>
    </div>
  )
}

function markerColor(observation: Observation): string {
  const { avalanchesObserved, cracking, collapsing } = observation.instability
  return observationColor(avalanchesObserved, cracking || collapsing)
}

function Header({
  observation,
  timezone,
  TitleTag,
}: {
  observation: Observation
  timezone: string
  TitleTag: DetailTitleTag
}) {
  return (
    <header className="grid gap-4 md:grid-cols-3">
      <div className="flex flex-col gap-3 md:col-span-2">
        <RecordTitle
          TitleTag={TitleTag}
          title="Field Observation"
          location={observation.locationName}
        />
        <HeaderFields observation={observation} timezone={timezone} />
      </div>
      <LocationMap
        location={observation.location}
        color={markerColor(observation)}
        label={observation.locationName ?? 'the observation'}
      />
    </header>
  )
}

function AdvancedPanels({
  detail,
  hrefFor,
  onOpenAvalanche,
}: {
  detail: ObservationDetailData
  hrefFor: (id: string) => string
  onOpenAvalanche?: (id: string) => void
}) {
  const shows = [showsAvalanches, showsWeather, showsSnowpack, showsProblems]
  if (!shows.some((panelShows) => panelShows(detail))) return null
  return (
    <Panel>
      <AvalanchesSection detail={detail} hrefFor={hrefFor} onOpen={onOpenAvalanche} />
      <WeatherSection detail={detail} />
      <SnowpackSection detail={detail} />
      <ProblemsSection detail={detail} />
    </Panel>
  )
}

interface ObservationDetailProps {
  detail: ObservationDetailData
  timezone: string
  /** Tenant-relative paths are prefixed with this (the tenant segment on a path-routed host). */
  prefix?: string
  /** Open a nested avalanche over the list; without it the avalanche cards are plain links. */
  onOpenAvalanche?: (id: string) => void
  TitleTag?: DetailTitleTag
}

export function ObservationDetail({
  detail,
  timezone,
  prefix = '',
  onOpenAvalanche,
  TitleTag = 'h1',
}: ObservationDetailProps) {
  const { observation } = detail
  return (
    <article className="flex flex-col gap-6" data-testid="observation-detail">
      <Header observation={observation} timezone={timezone} TitleTag={TitleTag} />
      <Panel>
        <SummarySection detail={detail} />
      </Panel>
      <MediaGallery tiles={detail.gallery} lightbox={detail.lightbox} />
      <AdvancedPanels
        detail={detail}
        hrefFor={(id) => `${prefix}${detailPath('avalanche', id)}`}
        onOpenAvalanche={onOpenAvalanche}
      />
      {observation.observer.type !== 'forecaster' && <ReviewDisclaimer />}
    </article>
  )
}

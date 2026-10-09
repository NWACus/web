/**
 * One avalanche problem, matching the legacy afp widget: headed "Problem #{rank}: {name}", with
 * four labeled columns (Problem Type icon + name, Aspect/Elevation rose, Likelihood, Size) at the
 * widget's sizes, then the discussion with the example photo floated inline to its right.
 *
 * Not a card of its own: the problems sit in the forecast's one panel under a shared heading, as
 * in the widget.
 */
import type { ReactNode } from 'react'

import { GlossaryProse } from '@/components/glossary/GlossaryProse.client'
import {
  AvalancheProblemName,
  MediaType,
  type AvalancheProblem,
} from '@/services/nac/model/forecast'
import type { ElevationBandNames } from '@/services/nac/types/schemas'
import { cn } from '@/utilities/ui'

import { labelHeading, subsectionHeading } from './forecastHeadings'
import { forecastProse } from './forecastProse'
import { InfoPopover } from './InfoPopover'
import { toLightboxMedia, type LightboxMedia } from './lightboxMedia'
import { LocatorRose } from './LocatorRose'
import { getPosterUrl } from './mediaItem'
import { ProblemMediaFigure } from './ProblemMediaFigure'
import { LikelihoodSlider, SizeSlider } from './ProblemSlider'
import { sanitizeHtml } from './sanitizeHtml'

/** Maps problem names to local icon filenames at /images/problem-icons/{name}.png */
const problemIconFile: Record<AvalancheProblemName, string> = {
  [AvalancheProblemName.DryLoose]: 'DryLoose',
  [AvalancheProblemName.StormSlab]: 'StormSlab',
  [AvalancheProblemName.WindSlab]: 'WindSlab',
  [AvalancheProblemName.PersistentSlab]: 'PersistentSlab',
  [AvalancheProblemName.DeepPersistentSlab]: 'DeepPersistentSlab',
  [AvalancheProblemName.WetLoose]: 'WetLoose',
  [AvalancheProblemName.WetSlab]: 'WetSlab',
  [AvalancheProblemName.CorniceFall]: 'CorniceFall',
  [AvalancheProblemName.Glide]: 'Glide',
  [AvalancheProblemName.GlideAvalanches]: 'Glide',
}

const knownProblemNames: readonly string[] = Object.values(AvalancheProblemName)

function isKnownProblemName(name: string): name is AvalancheProblemName {
  return knownProblemNames.includes(name)
}

/** Null for a type we have no icon for, which shows its name alone rather than a broken image. */
function problemIconUrl(name: string): string | null {
  return isKnownProblemName(name) ? `/images/problem-icons/${problemIconFile[name]}.png` : null
}

/**
 * The example media for a problem — the still to show inline, plus what it opens as — or null if
 * there is nothing displayable.
 *
 * Video counts. The AFP stores a problem video as a YouTube id with a poster frame, and the legacy
 * widget shows that poster with a play glyph over it; returning null here, as this used to, meant
 * a forecaster's clip vanished from the page entirely.
 *
 * The caption is sanitized here, on the server. The figure is a client component that writes it
 * with `dangerouslySetInnerHTML` and hands the same item to the lightbox, so sanitizing any later
 * would carry `sanitize-html` into the bundle of every reader with an avalanche problem on screen.
 */
function problemMedia(
  media: AvalancheProblem['media'],
): { lightbox: LightboxMedia; posterSrc: string; isVideo: boolean } | null {
  const posterSrc = getPosterUrl(media)
  if (!posterSrc) return null

  return {
    lightbox: toLightboxMedia(media),
    posterSrc,
    isVideo: media.type === MediaType.Video,
  }
}

interface AvalancheProblemCardProps {
  problem: AvalancheProblem
  /** The zone's band names, for the rose's leader-line labels. */
  elevationBandNames?: ElevationBandNames
}

export function AvalancheProblemCard({ problem, elevationBandNames }: AvalancheProblemCardProps) {
  const media = problemMedia(problem.media)

  return (
    <div className="mb-12 last:mb-0">
      <h3 className={cn(subsectionHeading, 'mb-6')}>
        Problem #{problem.rank}: {problem.name}
      </h3>
      <ProblemAttributes problem={problem} elevationBandNames={elevationBandNames} />

      {(media || problem.discussion) && (
        <ProblemDiscussion media={media} discussion={problem.discussion} />
      )}
    </div>
  )
}

/**
 * Four labeled columns, matching the widget: Problem Type, Aspect/Elevation, Likelihood, Size.
 * Two-up at small widths, four-up from lg.
 */
function ProblemAttributes({
  problem,
  elevationBandNames,
}: {
  problem: AvalancheProblem
  elevationBandNames: ElevationBandNames | undefined
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 lg:grid-cols-4 printWide:grid-cols-4">
      <div className="mb-8 text-center">
        <h5 className={cn(labelHeading, 'mb-2')}>Problem Type</h5>
        <ProblemType problem={problem} />
      </div>
      <div className="mb-8 text-center">
        <h5 className={cn(labelHeading, 'mb-4')}>Aspect/Elevation</h5>
        <LocatorRose locations={problem.location} elevationBandNames={elevationBandNames} />
      </div>
      <div className="mb-8 text-center">
        <h5 className={cn(labelHeading, 'mb-8')}>Likelihood</h5>
        <LikelihoodSlider likelihood={problem.likelihood} />
      </div>
      <div className="mb-8 text-center">
        <h5 className={cn(labelHeading, 'mb-8')}>Size</h5>
        <SizeSlider size={problem.size} />
      </div>
    </div>
  )
}

/**
 * The type's icon over its name, as in the widget. The API's description of the type opens from
 * the icon, or from the name for a type we have no icon for (Forecast-80). It is sanitized here, on
 * the server: the popover is a client component that only renders it.
 */
function ProblemType({ problem }: { problem: AvalancheProblem }) {
  const iconUrl = problemIconUrl(problem.name)
  const description = sanitizeHtml(problem.problem_description).trim()
  const explained = (trigger: ReactNode) =>
    description ? (
      <InfoPopover
        html={description}
        label={`What "${problem.name}" means`}
        hint="Click to learn more"
      >
        {trigger}
      </InfoPopover>
    ) : (
      trigger
    )

  return (
    <>
      {iconUrl &&
        explained(
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={iconUrl}
            alt=""
            className="mx-auto mb-2.5 mt-6 block h-[130px] w-[130px] sm:mt-5 sm:h-[170px] sm:w-[170px]"
            aria-hidden="true"
          />,
        )}
      <div className="text-sm font-medium">
        {iconUrl
          ? problem.name
          : explained(
              <span className="underline decoration-dotted underline-offset-4">
                {problem.name}
              </span>,
            )}
      </div>
    </>
  )
}

/**
 * The discussion with the example media floated inline to its right (wraps on md+);
 * overflow-hidden contains the float within the problem. Sanitizing stays here on the server.
 */
function ProblemDiscussion({
  media,
  discussion,
}: {
  media: ReturnType<typeof problemMedia>
  discussion: string | null
}) {
  return (
    <div className="overflow-hidden">
      {media && (
        <ProblemMediaFigure
          media={media.lightbox}
          posterSrc={media.posterSrc}
          isVideo={media.isVideo}
        />
      )}
      {discussion && <GlossaryProse html={sanitizeHtml(discussion)} className={forecastProse} />}
    </div>
  )
}

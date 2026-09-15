/**
 * Avalanche problem card, matching the legacy afp widget: titled "Problem #{rank}: {name}",
 * with four labeled columns (Problem Type icon + name, Aspect/Elevation rose, Likelihood,
 * Size), then the discussion with the example photo floated inline to its right.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AvalancheProblemName,
  MediaType,
  type AvalancheProblem,
} from '@/services/nac/model/forecast'

import { LocatorRose } from './LocatorRose'
import { ProblemMediaFigure } from './ProblemMediaFigure'
import { LikelihoodSlider, SizeSlider } from './ProblemSlider'
import { toLightboxMedia, type LightboxMedia } from './lightboxMedia'
import { getPosterUrl } from './mediaItem'
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

function problemIconUrl(name: AvalancheProblemName): string {
  return `/images/problem-icons/${problemIconFile[name]}.png`
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
}

export function AvalancheProblemCard({ problem }: AvalancheProblemCardProps) {
  const media = problemMedia(problem.media)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Problem #{problem.rank}: {problem.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProblemAttributes problem={problem} />

        {(media || problem.discussion) && (
          <ProblemDiscussion media={media} discussion={problem.discussion} />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Four labeled columns, matching the widget: Problem Type, Aspect/Elevation, Likelihood, Size.
 * Two-up at small widths, four-up from lg.
 */
function ProblemAttributes({ problem }: { problem: AvalancheProblem }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 printWide:grid-cols-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <h5 className="text-sm font-semibold">Problem Type</h5>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={problemIconUrl(problem.name)} alt="" className="h-20 w-20" aria-hidden="true" />
        <span className="text-sm font-medium">{problem.name}</span>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h5 className="text-sm font-semibold">Aspect/Elevation</h5>
        <LocatorRose locations={problem.location} className="w-28" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h5 className="text-sm font-semibold">Likelihood</h5>
        <LikelihoodSlider likelihood={problem.likelihood} className="h-32" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h5 className="text-sm font-semibold">Size</h5>
        <SizeSlider size={problem.size} className="h-32" />
      </div>
    </div>
  )
}

/**
 * The discussion with the example media floated inline to its right (wraps on md+);
 * overflow-hidden contains the float within the card. Sanitizing stays here on the server.
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
      {discussion && (
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(discussion) }}
        />
      )}
    </div>
  )
}

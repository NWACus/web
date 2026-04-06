/**
 * Avalanche problem card: problem icon/name, locator rose, likelihood + size sliders,
 * discussion HTML, and media thumbnail.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AvalancheProblemName,
  MediaType,
  type AvalancheProblem,
} from '@/services/nac/types/forecastSchemas'

import { LocatorRose } from './LocatorRose'
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

function problemIconUrl(name: AvalancheProblemName): string {
  return `/images/problem-icons/${problemIconFile[name]}.png`
}

/**
 * Returns a thumbnail URL for a problem's media item, or null if not displayable.
 * Handles the image and photo media type variants.
 */
function mediaThumbnailUrl(media: AvalancheProblem['media']): string | null {
  if (media.type === MediaType.Image) {
    return media.url.thumbnail
  }
  if (media.type === MediaType.Photo) {
    return typeof media.url === 'string' ? media.url : null
  }
  return null
}

interface AvalancheProblemCardProps {
  problem: AvalancheProblem
}

export function AvalancheProblemCard({ problem }: AvalancheProblemCardProps) {
  const thumbnail = mediaThumbnailUrl(problem.media)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={problemIconUrl(problem.name)}
            alt=""
            className="h-10 w-10"
            aria-hidden="true"
          />
          {problem.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rose + sliders row */}
        <div className="flex items-start gap-4">
          <LocatorRose locations={problem.location} className="w-28 shrink-0" />
          <div className="flex gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Likelihood</span>
              <LikelihoodSlider likelihood={problem.likelihood} className="h-32" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Size</span>
              <SizeSlider size={problem.size} className="h-32" />
            </div>
          </div>
        </div>

        {/* Discussion */}
        {problem.discussion && (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.discussion) }}
          />
        )}

        {/* Media thumbnail */}
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt={problem.media.type === MediaType.Image ? (problem.media.caption ?? '') : ''}
            className="rounded-md"
          />
        )}
      </CardContent>
    </Card>
  )
}

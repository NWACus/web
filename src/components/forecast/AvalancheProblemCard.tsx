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
 * The example photo (src + optional HTML caption) for a problem's media item, or null if not
 * displayable. Uses the medium image size to fill the inline figure; handles image and photo.
 */
function problemPhoto(
  media: AvalancheProblem['media'],
): { src: string; caption: string | null } | null {
  if (media.type === MediaType.Image) {
    return { src: media.url.medium, caption: media.caption }
  }
  if (media.type === MediaType.Photo) {
    return typeof media.url === 'string' ? { src: media.url, caption: media.caption } : null
  }
  return null
}

interface AvalancheProblemCardProps {
  problem: AvalancheProblem
}

export function AvalancheProblemCard({ problem }: AvalancheProblemCardProps) {
  const photo = problemPhoto(problem.media)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Problem #{problem.rank}: {problem.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Four labeled columns, matching the widget: Problem Type, Aspect/Elevation,
            Likelihood, Size. Two-up at small widths, four-up from lg. */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <h5 className="text-sm font-semibold">Problem Type</h5>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={problemIconUrl(problem.name)}
              alt=""
              className="h-20 w-20"
              aria-hidden="true"
            />
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

        {/* Discussion with the example photo floated inline to the right (wraps on md+);
            overflow-hidden contains the float within the card. */}
        {(photo || problem.discussion) && (
          <div className="overflow-hidden">
            {photo && (
              <figure className="mb-3 md:float-right md:mb-2 md:ml-6 md:w-1/2 lg:w-1/3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt="" className="w-full rounded-md" />
                {photo.caption && (
                  <figcaption
                    className="pt-2 text-center text-sm italic text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(photo.caption) }}
                  />
                )}
              </figure>
            )}
            {problem.discussion && (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(problem.discussion) }}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

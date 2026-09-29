import { ButtonLink } from '@/components/ButtonLink'
import { NotFoundMessage } from '@/components/NotFoundMessage'
import { TrackPageNotFound } from '@/components/TrackPageNotFound.client'

export default function NotFound() {
  return (
    <NotFoundMessage>
      <TrackPageNotFound />
      <ButtonLink href="/" size="lg">
        Back to home
      </ButtonLink>
      <ButtonLink href="/forecasts/avalanche" variant="outline" size="lg">
        Check the avalanche forecast
      </ButtonLink>
    </NotFoundMessage>
  )
}

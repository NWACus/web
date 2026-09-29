import { ButtonLink } from '@/components/ButtonLink'
import { NotFoundMessage } from '@/components/NotFoundMessage'

export default function NotFound() {
  return (
    <NotFoundMessage>
      <ButtonLink href="/" size="lg">
        Back to home
      </ButtonLink>
      <ButtonLink href="/forecasts/avalanche" variant="outline" size="lg">
        Check the avalanche forecast
      </ButtonLink>
    </NotFoundMessage>
  )
}

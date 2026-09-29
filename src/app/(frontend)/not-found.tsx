import { ButtonLink } from '@/components/ButtonLink'
import { NotFoundMessage } from '@/components/NotFoundMessage'
import { getURL } from '@/utilities/getURL'

export default function NotFound() {
  return (
    <NotFoundMessage>
      <ButtonLink href={getURL()} size="lg">
        Find your local avalanche center
      </ButtonLink>
    </NotFoundMessage>
  )
}

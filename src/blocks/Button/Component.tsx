import { ButtonLink } from '@/components/ButtonLink'
import type { ButtonBlock as ButtonBlockProps } from 'src/payload-types'

export const ButtonBlockComponent = ({ button }: ButtonBlockProps) => {
  return (
    <div className="my-4">
      <ButtonLink className="no-underline me-4" {...button} />
    </div>
  )
}

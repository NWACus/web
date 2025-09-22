import { CMSLink } from '@/components/Link'
import type { ButtonBlock as ButtonBlockProps } from 'src/payload-types'

export const ButtonBlockComponent = ({ button }: ButtonBlockProps) => {
  return (
    <div>
      <CMSLink className="no-underline me-4" {...button} />
    </div>
  )
}

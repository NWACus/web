import { CMSLink } from '@/components/Link'
import type { ButtonsBlock as ButtonBlockProps } from 'src/payload-types'

export const ButtonsBlock = ({ button }: ButtonBlockProps) => {
  return (
    <div>
      <CMSLink className="no-underline me-4" {...button} />
    </div>
  )
}

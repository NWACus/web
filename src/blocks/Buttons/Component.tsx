import { CMSLink } from '@/components/Link'
import type { ButtonsBlock as ButtonBlockProps } from 'src/payload-types'

export const ButtonsBlock = ({ buttons }: ButtonBlockProps) => {
  return (
    <div>
      {buttons?.map((button) => {
        return <CMSLink key={button.id} className="no-underline me-4" {...button.button} />
      })}
    </div>
  )
}

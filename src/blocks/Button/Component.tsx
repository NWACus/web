import { CMSLink } from '@/components/Link'
import type { ButtonBlock as ButtonBlockProps } from 'src/payload-types'

export const ButtonBlock = ({ buttons }: ButtonBlockProps) => {
  return (
    <div>
      {buttons?.map((button) => {
        return <CMSLink key={button.id} className="no-underline me-4" {...button.button} />
      })}
    </div>
  )
}

import type { MembershipBlock as MembershipBlockProps } from '@/payload-types'

import RichText from '@/components/RichText'

export const MembershipBlock = ({ richText }: MembershipBlockProps) => {
  return (
    <div className="container">
      {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
    </div>
  )
}

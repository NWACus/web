import type { MembershipBlock as MembershipBlockProps } from '@/payload-types'

import RichText from '@/components/RichText'

export const MembershipBlock = ({ richText }: MembershipBlockProps) => {
  return (
    <div className="container">
      <div className="bg-card rounded border-border border p-4 flex flex-col gap-8 md:flex-row md:justify-between md:items-center">
        <div className="max-w-[48rem] flex items-center">
          {richText && <RichText className="mb-0" data={richText} enableGutter={false} />}
        </div>
        <div className="flex flex-col gap-8"></div>
      </div>
    </div>
  )
}

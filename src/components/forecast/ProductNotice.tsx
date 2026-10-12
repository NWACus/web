/**
 * The bar the archived and expired notices share: the legacy afp ForecastBanner's grey
 * `alert-secondary` with white large text and a large icon, the loudest element in the header.
 */
import type { LucideIcon } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

interface ProductNoticeProps extends Pick<ComponentPropsWithoutRef<'div'>, 'role'> {
  icon: LucideIcon
  children: ReactNode
}

/** The widget's notice links: white and underlined, fading on hover. */
export const PRODUCT_NOTICE_LINK_CLASS =
  'text-white underline underline-offset-2 hover:text-[rgba(255,255,255,0.7)]'

export function ProductNotice({ icon: Icon, role, children }: ProductNoticeProps) {
  // Exact color even on a plain Cmd+P print, which would otherwise drop the grey and leave white text.
  return (
    <div
      role={role}
      className="flex items-center gap-2 rounded border-2 border-[#797d80] bg-[#797d80] p-2 text-[1.2rem] leading-normal text-white [-webkit-print-color-adjust:exact] [print-color-adjust:exact]"
    >
      <Icon className="h-12 w-12 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

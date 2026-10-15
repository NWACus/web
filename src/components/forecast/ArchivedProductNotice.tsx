/**
 * The notice that marks a dated view as an archived product, with links to the current product and
 * to the archive it came from — the legacy afp ForecastBanner's wording ("This is an archived
 * product. View the … or …").
 */
import { History } from 'lucide-react'
import Link from 'next/link'

import { PRODUCT_NOTICE_LINK_CLASS, ProductNotice } from './ProductNotice'

interface NoticeLink {
  href: string
  label: string
}

interface ArchivedProductNoticeProps {
  /** Absent when there is no current product to send the reader to (a retired zone). */
  current?: NoticeLink
  archive: NoticeLink
}

export function ArchivedProductNotice({ current, archive }: ArchivedProductNoticeProps) {
  return (
    <ProductNotice icon={History}>
      This is an archived product. View{' '}
      {current && (
        <>
          the{' '}
          <Link href={current.href} className={PRODUCT_NOTICE_LINK_CLASS}>
            {current.label}
          </Link>{' '}
          or{' '}
        </>
      )}
      <Link href={archive.href} className={PRODUCT_NOTICE_LINK_CLASS}>
        {archive.label}
      </Link>
      .
    </ProductNotice>
  )
}

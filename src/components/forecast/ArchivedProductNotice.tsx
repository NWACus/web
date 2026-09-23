/**
 * The notice that marks a dated view as an archived product, with links to the current product and
 * to the archive it came from — the legacy afp ForecastBanner's wording ("This is an archived
 * product. View the … or …").
 */
import { History } from 'lucide-react'
import Link from 'next/link'

interface NoticeLink {
  href: string
  label: string
}

interface ArchivedProductNoticeProps {
  current: NoticeLink
  archive: NoticeLink
}

const LINK_CLASS = 'font-medium underline underline-offset-2 hover:no-underline'

export function ArchivedProductNotice({ current, archive }: ArchivedProductNoticeProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
      <History className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>
        This is an archived product. View the{' '}
        <Link href={current.href} className={LINK_CLASS}>
          {current.label}
        </Link>{' '}
        or{' '}
        <Link href={archive.href} className={LINK_CLASS}>
          {archive.label}
        </Link>
        .
      </span>
    </div>
  )
}

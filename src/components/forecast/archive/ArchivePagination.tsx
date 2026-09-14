/**
 * Page links under the list, fifty rows a page as in the legacy widget. Every link is a real
 * `<a>` carrying the current filters with only `page` changed, so a page is a shareable address
 * and the browser's back button steps through them.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import type { ArchiveQuery } from '@/services/nac/forecastArchive'
import { cn } from '@/utilities/ui'

import { serializeArchiveSearchParams } from './archiveSearchParams'

interface ArchivePaginationProps {
  /** The tenant-relative path of the browser, which every link stays on. */
  basePath: string
  /** The query as loaded from the URL, so the links carry the reader's filters verbatim. */
  query: ArchiveQuery
  page: number
  pageCount: number
}

/** How many page numbers to show either side of the current one. */
const NEIGHBOURS = 2

/**
 * The page numbers to show: the first and last always, the current one and its neighbours, and
 * `null` where a run of pages is skipped.
 */
export function paginationItems(page: number, pageCount: number): (number | null)[] {
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pageCount || Math.abs(n - page) <= NEIGHBOURS,
  )
  return pages.flatMap((n, i) => (i > 0 && n - pages[i - 1] > 1 ? [null, n] : [n]))
}

export function ArchivePagination({ basePath, query, page, pageCount }: ArchivePaginationProps) {
  if (pageCount <= 1) return null

  const hrefFor = (n: number) =>
    `${basePath}${serializeArchiveSearchParams({ ...query, page: n === 1 ? null : n })}`
  const previousHref = page > 1 ? hrefFor(page - 1) : undefined
  const nextHref = page < pageCount ? hrefFor(page + 1) : undefined

  return (
    <Pagination>
      <PaginationContent>
        <PageStep direction="previous" href={previousHref} />
        <PageNumbers page={page} pageCount={pageCount} hrefFor={hrefFor} />
        <PageStep direction="next" href={nextHref} />
      </PaginationContent>
    </Pagination>
  )
}

function PageNumbers({
  page,
  pageCount,
  hrefFor,
}: {
  page: number
  pageCount: number
  hrefFor: (n: number) => string
}) {
  return paginationItems(page, pageCount).map((item, index) => (
    <PaginationItem key={item ?? `gap-${index}`}>
      {item === null ? (
        <PaginationEllipsis />
      ) : (
        <PageNumber n={item} isCurrent={item === page} href={hrefFor(item)} />
      )}
    </PaginationItem>
  ))
}

const stepClassName = cn(buttonVariants({ size: 'default', variant: 'ghost' }), 'gap-1')

const STEPS = {
  previous: { label: 'Go to previous page', text: 'Previous', Icon: ChevronLeft },
  next: { label: 'Go to next page', text: 'Next', Icon: ChevronRight },
}

/** Previous/next: a link, or inert at either end of the list. */
function PageStep({
  direction,
  href,
}: {
  direction: keyof typeof STEPS
  href: string | undefined
}) {
  const { label, text, Icon } = STEPS[direction]
  const content = (
    <>
      {direction === 'previous' && <Icon className="h-4 w-4" aria-hidden="true" />}
      <span>{text}</span>
      {direction === 'next' && <Icon className="h-4 w-4" aria-hidden="true" />}
    </>
  )

  return (
    <PaginationItem>
      {href ? (
        <Link href={href} prefetch={false} className={stepClassName} aria-label={label}>
          {content}
        </Link>
      ) : (
        <span className={cn(stepClassName, 'pointer-events-none opacity-50')} aria-label={label}>
          {content}
        </span>
      )}
    </PaginationItem>
  )
}

/** A page number: the current one as inert text, any other as a link. */
function PageNumber({ n, isCurrent, href }: { n: number; isCurrent: boolean; href: string }) {
  if (isCurrent) {
    return (
      <span
        className={buttonVariants({ size: 'icon', variant: 'outline' })}
        aria-current="page"
        aria-label={`Page ${n}`}
      >
        {n}
      </span>
    )
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className={buttonVariants({ size: 'icon', variant: 'ghost' })}
      aria-label={`Go to page ${n}`}
    >
      {n}
    </Link>
  )
}

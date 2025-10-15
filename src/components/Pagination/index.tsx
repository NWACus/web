'use client'
import {
  Pagination as PaginationComponent,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { normalizePath } from '@/utilities/path'
import { cn } from '@/utilities/ui'
import { useRouter, useSearchParams } from 'next/navigation'

export const Pagination = (props: {
  className?: string
  page: number
  totalPages: number
  relativePath: string
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const params = searchParams ? '?' + new URLSearchParams(searchParams.toString()) : null

  const { className, page, totalPages } = props
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  const hasExtraPrevPages = page - 1 > 1
  const hasExtraNextPages = page + 1 < totalPages

  const goToPage = (pageNumber: number) => {
    router.push(
      `${normalizePath(props.relativePath, { ensureLeadingSlash: true })}/${pageNumber}${params}`,
    )
  }

  return (
    <div className={cn('my-12', className)}>
      <PaginationComponent>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious disabled={!hasPrevPage} onClick={() => goToPage(page - 1)} />
          </PaginationItem>

          {hasExtraPrevPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink onClick={() => goToPage(page - 1)}>{page - 1}</PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink isActive onClick={() => goToPage(page)}>
              {page}
            </PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink onClick={() => goToPage(page + 1)}>{page + 1}</PaginationLink>
            </PaginationItem>
          )}

          {hasExtraNextPages && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext disabled={!hasNextPage} onClick={() => goToPage(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </PaginationComponent>
    </div>
  )
}

/**
 * The archive browser's filter stack — date, zone, danger, product type — in the site's sidebar
 * filter idiom (as the blog and events pages use), standing in for the legacy widget's dropdown
 * bar. Rendered in the desktop sidebar and again inside the mobile drawer.
 *
 * Every control writes the URL with `shallow: false` so the server re-renders the list, and clears
 * `page` so a narrowed list starts from its first page, as the legacy browser does.
 */
import { CheckboxFilter } from '@/components/filters/CheckboxFilter'
import { dangerLevelFromRating, dangerName } from '@/services/nac/dangerScale'
import {
  ARCHIVE_DANGER_LEVELS,
  ARCHIVE_PRODUCT_TYPES,
  archiveProductTypeLabel,
} from '@/services/nac/forecastArchive'

import { ArchiveDateFilter, type ArchiveDateFilterProps } from './ArchiveDateFilter.client'

export interface ArchiveFiltersProps extends ArchiveDateFilterProps {
  zones: { slug: string; name: string }[]
}

const DANGER_OPTIONS = ARCHIVE_DANGER_LEVELS.map((level) => ({
  value: String(level),
  label: dangerName(dangerLevelFromRating(level)),
}))

const PRODUCT_TYPE_OPTIONS = ARCHIVE_PRODUCT_TYPES.map((type) => ({
  value: type,
  label: archiveProductTypeLabel(type),
}))

const RESET_PAGE = ['page']

export function ArchiveFilters({ zones, ...dateProps }: ArchiveFiltersProps) {
  return (
    <>
      <ArchiveDateFilter {...dateProps} />
      <CheckboxFilter
        title="Zone"
        urlParam="zone"
        // A single-zone center has nothing to choose between; the legacy widget hides it too.
        options={
          zones.length > 1 ? zones.map((zone) => ({ value: zone.slug, label: zone.name })) : []
        }
        defaultOpen
        shallow={false}
        resetParams={RESET_PAGE}
      />
      <CheckboxFilter
        title="Danger"
        urlParam="danger"
        options={DANGER_OPTIONS}
        defaultOpen
        shallow={false}
        resetParams={RESET_PAGE}
      />
      <CheckboxFilter
        title="Product Type"
        urlParam="type"
        options={PRODUCT_TYPE_OPTIONS}
        defaultOpen
        showBottomBorder={false}
        shallow={false}
        resetParams={RESET_PAGE}
      />
    </>
  )
}

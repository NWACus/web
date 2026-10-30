import { ImageMedia } from '@/components/Media/ImageMedia'
import { getImageWidthFromMaxHeight } from '@/utilities/getImageWidthFromMaxHeight'

import { DirectoryMap } from './DirectoryMap'
import type { DirectoryCenter } from './types'

/** Logos are sized by height so a wide wordmark and a square badge both read at the same scale. */
const LOGO_HEIGHT = 80

interface CenterDirectoryProps {
  centers: DirectoryCenter[]
}

/** The production centers, one row each: identity on the left, a live danger map on the right. */
export function CenterDirectory({ centers }: CenterDirectoryProps) {
  return (
    <section aria-label="Avalanche centers on AvyWeb" className="container pb-20">
      <ol className="divide-y divide-[#dde5ee] border-t border-[#dde5ee]">
        {centers.map((center) => (
          <CenterRow key={center.slug} center={center} />
        ))}
      </ol>
    </section>
  )
}

function CenterRow({ center }: { center: DirectoryCenter }) {
  return (
    <li className="grid gap-6 py-8 lg:grid-cols-2 lg:gap-10 lg:py-10">
      <div>
        <a href={center.href} className="group flex flex-col items-start gap-5">
          {center.logo && (
            <ImageMedia
              resource={center.logo}
              imgClassName="h-16 w-auto max-w-[240px] object-contain md:h-20"
              sizes={getImageWidthFromMaxHeight(center.logo, LOGO_HEIGHT)}
            />
          )}
          <span className="min-w-0">
            <span className="block text-2xl font-black leading-tight xl:text-3xl">
              {center.name}
            </span>
            <span className="mt-1 block text-base font-light text-[#1b3a5c] underline-offset-4 group-hover:underline md:text-lg">
              {center.domain}
            </span>
          </span>
        </a>
        {center.description && (
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
            {center.description}
          </p>
        )}
      </div>

      <DirectoryMap
        centerSlug={center.slug}
        className="h-[320px] overflow-hidden rounded-md border border-[#dde5ee] bg-[#f5f7fa] md:h-[380px]"
      />
    </li>
  )
}

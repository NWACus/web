'use client'

import Link from 'next/link'

import type { Provider } from '@/payload-types'

import { courseTypesData } from '@/constants/courseTypes'
import { cn } from '@/utilities/ui'
import { isValidFullUrl } from '@/utilities/validateUrl'
import { ExternalLink, Mail, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'

export const ProviderPreview = (props: { doc?: Provider }) => {
  const { doc } = props

  if (!doc) return null

  const { name, details, website, email, phone, courseTypes } = doc

  const courseTypeLabels = courseTypes
    ?.map((ct) => courseTypesData.find((ctd) => ctd.value === ct)?.label)
    .filter(Boolean)

  const validWebsite = website && isValidFullUrl(website) ? website : null

  const contactItems = [email, phone, validWebsite].filter(Boolean)

  return (
    <Dialog>
      <DialogTrigger className="cursor-help hover:underline text-base w-fit">{name}</DialogTrigger>
      <DialogContent className="flex flex-col gap-2" overlayClassName="bg-transparent">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
        </DialogHeader>
        {courseTypeLabels && courseTypeLabels.length > 0 && (
          <p>
            <span className="font-semibold">Offers:</span> {courseTypeLabels.join(', ')}
          </p>
        )}
        {details && <p className="hidden md:block text-sm leading-tight">{details}</p>}
        <div className={cn('space-y-1', contactItems.length > 1 && 'md:columns-2')}>
          {email && (
            <a href={`mailto:${email}`} className="flex gap-1 text-sm">
              <Mail className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{email}</span>
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="flex gap-1 text-sm">
              <Phone className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{phone}</span>
            </a>
          )}
          {validWebsite && (
            <Link
              href={validWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>Website</span>
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

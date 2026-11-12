import Image from 'next/image'

import { LinkList } from './LinkList'

export const AVALANCHE_ORG_URL = 'https://avalanche.org/'

const LINKS = [
  { href: 'https://avalanche.org/avalanche-courses/#course-providers', label: 'Course providers' },
  { href: 'https://avalanche.org/avalanche-course-calendar/', label: 'Course calendar' },
  { href: AVALANCHE_ORG_URL, label: 'avalanche.org' },
]

/** Credits the American Avalanche Association collaboration: the course catalog AvyWeb runs for avalanche.org. */
export function AvalancheOrgSection() {
  return (
    <section
      aria-labelledby="avalanche-org-heading"
      className="border-t border-[#dde5ee] bg-[#f5f7fa]"
    >
      <div className="container grid items-center gap-10 py-16 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:py-20">
        <a href={AVALANCHE_ORG_URL} className="block w-fit" title="American Avalanche Association">
          <Image
            src="/assets/a3-logo.png"
            alt="American Avalanche Association"
            width={1361}
            height={444}
            sizes="(min-width: 768px) 246px, 196px"
            className="h-16 w-auto md:h-20"
          />
        </a>

        <div>
          <h2 id="avalanche-org-heading" className="text-3xl font-black leading-tight">
            In collaboration with avalanche.org
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            AvyWeb also runs the avalanche course catalog for the American Avalanche Association.
            A3-recognized providers use AvyWeb to manage their own course offerings, and the course
            listings and provider directory can be embedded on third-party sites as well.
          </p>
          <LinkList
            links={LINKS}
            linkClassName="font-bold text-[#1b3a5c] underline-offset-4 hover:underline"
            className="mt-6 gap-x-8"
          />
        </div>
      </div>
    </section>
  )
}

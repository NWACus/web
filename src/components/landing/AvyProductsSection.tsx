import Image from 'next/image'
import type { ReactNode } from 'react'

import { cn } from '@/utilities/ui'

const APP_STORE_URL = 'https://apps.apple.com/us/app/avy-avalanche-weather-info/id6444379522'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=us.nwac.forecast'

/** Introduces the two things the Avy team builds, AvyWeb and AvyApp, on a band in the Avy logo's navy. */
export function AvyProductsSection() {
  return (
    <section aria-labelledby="avy-products-heading" className="bg-[#152e57] text-white">
      <div className="container py-16 md:py-24">
        <h2
          id="avy-products-heading"
          className="max-w-2xl text-4xl font-black leading-tight md:text-5xl"
        >
          Shared tools for every center
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <AvyWebCard />
          <AvyAppCard />
        </div>
      </div>
    </section>
  )
}

function AvyWebCard() {
  return (
    <ProductCard
      eyebrow="Website platform"
      name="Web"
      accentClassName="bg-[#0084f0]"
      lead="AvyWeb is a modern multi-tenant website platform."
    >
      <p>
        The intention of the platform is to go beyond standardizing forecast products with
        streamlined content and improved user experience. Centers share website infrastructure and
        maintenance while preserving their unique identities.
      </p>
      <p>
        By sharing a unified front end experience, we are able to learn and iterate from user
        interactions to continually improve our forecast, education and fundraising products.
      </p>
    </ProductCard>
  )
}

function AvyAppCard() {
  return (
    <ProductCard
      eyebrow="Mobile app"
      name="App"
      accentClassName="bg-[#40a9ff]"
      lead="Built by the Northwest Avalanche Center as a mobile-first experience."
      footer={<StoreBadges />}
    >
      <p>
        Avalanche forecasts, weather forecasts, weather station data, and observations on iOS and
        Android.
      </p>
      <p>It is now used by avalanche centers nationwide.</p>
    </ProductCard>
  )
}

interface ProductCardProps {
  eyebrow: string
  /** The suffix after "Avy", set in the card's accent so the product names echo the logo's blues. */
  name: string
  accentClassName: string
  lead: string
  children: ReactNode
  footer?: ReactNode
}

function ProductCard({ eyebrow, name, accentClassName, lead, children, footer }: ProductCardProps) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-md bg-[#1c3a6b] p-8 md:p-10">
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1.5', accentClassName)} />
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#93ceff]">{eyebrow}</p>
      <h3 className="mt-4 text-5xl font-black leading-none tracking-tight md:text-6xl">
        Avy<span className="text-[#40a9ff]">{name}</span>
      </h3>
      <p className="mt-6 text-balance text-xl font-light leading-snug md:text-2xl">{lead}</p>
      <div className="mt-4 grid gap-4 text-base leading-relaxed text-[#c9d6e8]">{children}</div>
      {footer && <div className="mt-auto pt-8">{footer}</div>}
    </article>
  )
}

/**
 * The official store badges, unaltered and at the same height. Apple's guidelines set a 40px
 * on-screen minimum; the Google Play artwork has its transparent margin trimmed to sit flush.
 */
function StoreBadges() {
  return (
    <ul className="flex flex-wrap items-center gap-4">
      <li>
        <a href={APP_STORE_URL} className="block transition-opacity hover:opacity-80">
          <Image
            src="/assets/store-badges/app-store.svg"
            alt="Download Avy on the App Store"
            width={120}
            height={40}
            unoptimized
            className="h-10 w-auto md:h-12"
          />
        </a>
      </li>
      <li>
        <a href={PLAY_STORE_URL} className="block transition-opacity hover:opacity-80">
          <Image
            src="/assets/store-badges/google-play.png"
            alt="Get Avy on Google Play"
            width={564}
            height={168}
            sizes="(min-width: 768px) 162px, 135px"
            className="h-10 w-auto md:h-12"
          />
        </a>
      </li>
    </ul>
  )
}

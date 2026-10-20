import Image from 'next/image'

import avyIcon from '@/assets/icon.png'

const AFP_URL =
  'https://avalanche.org/wp-content/uploads/2025/06/NAC-USDA-Forest-Service-Avalanche-Forecast-Platform.pdf'

/** The Avy mark, wordmark and mission that open the root landing page. */
export function LandingHeader() {
  return (
    <header className="container pb-12 pt-16 md:pb-16 md:pt-24">
      <h1 className="flex items-center gap-5 text-7xl font-black leading-none tracking-tight md:gap-8 md:text-[8.5rem]">
        <Image
          src={avyIcon}
          alt=""
          priority
          sizes="(min-width: 768px) 128px, 80px"
          className="size-20 md:size-32"
        />
        Avy
      </h1>
      <div className="mt-8 grid gap-6">
        <p className="text-2xl font-light leading-snug md:text-3xl">
          Avy is a collaborative effort between avalanche centers in the U.S. to upgrade and
          maintain consistent public facing technology for users across the nation.
        </p>
        <p className="text-base leading-relaxed text-slate-600">
          The Avy team works alongside the National Avalanche Center (NAC) and the{' '}
          <a
            href={AFP_URL}
            className="font-bold text-[#1b3a5c] underline underline-offset-4 hover:no-underline"
          >
            Avalanche Forecast Platform (AFP)
          </a>
          .
        </p>
      </div>
    </header>
  )
}

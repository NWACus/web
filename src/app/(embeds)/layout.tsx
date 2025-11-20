import { CustomEmbedStyles } from '@/components/CustomEmbedStyles'
import { PostHogProvider } from '@/providers/PostHogProvider'
import { getURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Metadata } from 'next'
import { Fjalla_One, Libre_Franklin } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import './a3-globals.css'

const fjallaOne = Fjalla_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fjalla-one',
})

const libreFranklin = Libre_Franklin({
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-libre-franklin',
})

type Args = {
  children: React.ReactNode
}

export default async function EmbedsLayout({ children }: Args) {
  return (
    <html
      className={`a3 ${fjallaOne.variable} ${libreFranklin.variable}`}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        {/** Sets backgroundColor and textColor from query params */}
        <CustomEmbedStyles />
        {/** We expect these routes to be embedded in iframes so we avoid using third-party cookies */}
        <PostHogProvider persistence="localStorage">
          <NuqsAdapter>
            <div className="flex flex-col max-w-screen overflow-x-clip">{children}</div>
          </NuqsAdapter>
        </PostHogProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: 'Avy',
  description: 'Avy embeds.',
  metadataBase: new URL(getURL()),
  openGraph: mergeOpenGraph({
    description: 'Avy embeds.',
    images: [
      {
        url: `${getURL()}/assets/avy-web-og-image.webp`,
      },
    ],
  }),
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/assets/favicon.ico',
  },
}

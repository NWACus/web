import { CustomEmbedStyles } from '@/components/CustomEmbedStyles'
import { PostHogProvider } from '@/providers/PostHogProvider'
import { getURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Metadata } from 'next'
import localFont from 'next/font/local'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Suspense } from 'react'
import './a3-globals.css'

// Self-hosted (latin subset) because next/font/google intermittently failed builds.
const fjallaOne = localFont({
  src: './fonts/FjallaOne-Regular.woff2',
  weight: '400',
  display: 'swap',
  variable: '--font-fjalla-one',
})

const libreFranklin = localFont({
  src: [
    { path: './fonts/LibreFranklin-Variable.woff2', weight: '400 700', style: 'normal' },
    { path: './fonts/LibreFranklin-VariableItalic.woff2', weight: '400 700', style: 'italic' },
  ],
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
        {/** We expect these routes to be embedded in iframes so we avoid using third-party cookies */}
        <PostHogProvider persistence="localStorage">
          <NuqsAdapter>
            {/** Sets backgroundColor and textColor from query params */}
            <Suspense fallback={null}>
              <CustomEmbedStyles />
            </Suspense>
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

import { getURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Metadata } from 'next'

type Args = {
  children: React.ReactNode
}

export default async function EmbedsLayout({ children }: Args) {
  return (
    <div className="a3">
      <div className="flex flex-col min-h-screen max-w-screen overflow-x-hidden">{children}</div>
    </div>
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

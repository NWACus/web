import { AdminBar } from '@/components/AdminBar'
import { PostHogProvider } from '@/providers/PostHogProvider'
import { getURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { cn } from '@/utilities/ui'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { draftMode } from 'next/headers'
import React from 'react'
import './globals.css'

const lato = localFont({
  src: [
    {
      path: './fonts/LatoLatin-Hairline.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: './fonts/LatoLatin-HairlineItalic.woff2',
      weight: '100',
      style: 'italic',
    },
    {
      path: './fonts/LatoLatin-Thin.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './fonts/LatoLatin-ThinItalic.woff2',
      weight: '200',
      style: 'italic',
    },
    {
      path: './fonts/LatoLatin-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/LatoLatin-LightItalic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: './fonts/LatoLatin-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/LatoLatin-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/LatoLatin-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/LatoLatin-MediumItalic.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './fonts/LatoLatin-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/LatoLatin-SemiboldItalic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './fonts/LatoLatin-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/LatoLatin-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: './fonts/LatoLatin-Heavy.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './fonts/LatoLatin-HeavyItalic.woff2',
      weight: '800',
      style: 'italic',
    },
    {
      path: './fonts/LatoLatin-Black.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: './fonts/LatoLatin-BlackItalic.woff2',
      weight: '900',
      style: 'italic',
    },
  ],
  display: 'swap',
  preload: true,
  variable: '--font-lato',
})

type Args = {
  children: React.ReactNode
}

export default async function RootLayout({ children }: Args) {
  const { isEnabled } = await draftMode()

  return (
    <html className={cn(lato.variable)} lang="en" suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="96x96" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <PostHogProvider>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: 'Avy',
  description: 'The homepage for Avy avalanche center websites.',
  metadataBase: new URL(getURL()),
  openGraph: mergeOpenGraph({
    description: 'Avy avalanche center websites.',
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

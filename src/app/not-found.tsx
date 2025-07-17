import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import localFont from 'next/font/local'
import './(frontend)/globals.css'

const lato = localFont({
  src: [
    {
      path: './(frontend)/fonts/LatoLatin-Hairline.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: './(frontend)/fonts/LatoLatin-HairlineItalic.woff2',
      weight: '100',
      style: 'italic',
    },
    {
      path: './(frontend)/fonts/LatoLatin-Thin.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './(frontend)/fonts/LatoLatin-ThinItalic.woff2',
      weight: '200',
      style: 'italic',
    },
    {
      path: './(frontend)/fonts/LatoLatin-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './(frontend)/fonts/LatoLatin-LightItalic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: './(frontend)/fonts/LatoLatin-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './(frontend)/fonts/LatoLatin-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './(frontend)/fonts/LatoLatin-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './(frontend)/fonts/LatoLatin-MediumItalic.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './(frontend)/fonts/LatoLatin-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './(frontend)/fonts/LatoLatin-SemiboldItalic.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './(frontend)/fonts/LatoLatin-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './(frontend)/fonts/LatoLatin-BoldItalic.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: './(frontend)/fonts/LatoLatin-Heavy.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './(frontend)/fonts/LatoLatin-HeavyItalic.woff2',
      weight: '800',
      style: 'italic',
    },
    {
      path: './(frontend)/fonts/LatoLatin-Black.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: './(frontend)/fonts/LatoLatin-BlackItalic.woff2',
      weight: '900',
      style: 'italic',
    },
  ],
  display: 'swap',
  preload: true,
  variable: '--font-lato',
})

export default function NotFound() {
  return (
    <html className={cn(lato.variable)} lang="en" suppressHydrationWarning>
      <head>
        <link href="/favicon.ico" rel="icon" sizes="96x96" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body className="w-screen h-screen overflow-x-hidden flex justify-center items-center">
        <div className="container py-28">
          <div className="prose max-w-none">
            <h1 style={{ marginBottom: 0 }}>404</h1>
            <p className="mb-4">This page could not be found.</p>
          </div>
          <Button asChild variant="default">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </body>
    </html>
  )
}

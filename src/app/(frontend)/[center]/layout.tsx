import type { Metadata } from 'next'

import { cn } from 'src/utilities/cn'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import { getServerSideURL } from '@/utilities/getURL'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Theme } from '@/payload-types'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    draft: false,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    select: {
      slug: true,
    },
  })

  return tenants.docs.map((tenant) => ({ center: tenant.slug }))
}

type Args = {
  children: React.ReactNode
  params: Promise<PathArgs>
}

type PathArgs = {
  center: string
}

const zinc: Theme = {
  name: 'Zinc',
  activeColors: {
    light: '240 5.9% 10%',
    dark: '240 5.2% 33.9%',
  },
  palettes: {
    light: {
      name: 'Zinc Light',
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '240 5.9% 10%',
      'primary-foreground': '0 0% 98%',
      secondary: '240 4.8% 95.9%',
      'secondary-foreground': '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      'muted-foreground': '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      'accent-foreground': '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 5.9% 10%',
      radius: '0.5rem',
      'chart-1': '12 76% 61%',
      'chart-2': '173 58% 39%',
      'chart-3': '197 37% 24%',
      'chart-4': '43 74% 66%',
      'chart-5': '27 87% 67%',
      id: 1,
      createdAt: '',
      updatedAt: '',
    },
    dark: {
      name: 'Zinc Dark',
      radius: '0.5rem',
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      card: '240 10% 3.9%',
      'card-foreground': '0 0% 98%',
      popover: '240 10% 3.9%',
      'popover-foreground': '0 0% 98%',
      primary: '0 0% 98%',
      'primary-foreground': '240 5.9% 10%',
      secondary: '240 3.7% 15.9%',
      'secondary-foreground': '0 0% 98%',
      muted: '240 3.7% 15.9%',
      'muted-foreground': '240 5% 64.9%',
      accent: '240 3.7% 15.9%',
      'accent-foreground': '0 0% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '0 0% 98%',
      border: '240 3.7% 15.9%',
      input: '240 3.7% 15.9%',
      ring: '240 4.9% 83.9%',
      'chart-1': '220 70% 50%',
      'chart-2': '160 60% 45%',
      'chart-3': '30 80% 55%',
      'chart-4': '280 65% 60%',
      'chart-5': '340 75% 55%',
      id: 1,
      createdAt: '',
      updatedAt: '',
    },
  },
  id: 1,
  createdAt: '',
  updatedAt: '',
}

export default async function RootLayout({ children, params }: Args) {
  const { isEnabled } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const { center } = await params
  let _centerTheme: Theme = zinc
  const theme = await payload.find({
    collection: 'brands',
    overrideAccess: true,
    select: {
      theme: true,
    },
    limit: 1,
    depth: 10,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })
  if (
    theme.docs &&
    theme.docs.length === 1 &&
    typeof theme.docs[0] === 'object' &&
    typeof theme.docs[0].theme === 'object'
  ) {
    _centerTheme = theme.docs[0].theme
  } else {
    throw new Error(`didn't find theme for center ${center}`)
  }

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
        {/*<style jsx>{style(centerTheme)}</style>*/}
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header center={center} />
          {children}
          <Footer center={center} />
        </Providers>
      </body>
    </html>
  )
}

const _style: (theme: Theme) => string = (theme: Theme): string => {
  if (typeof theme.palettes.light !== 'object' || typeof theme.palettes.dark !== 'object') {
    throw new Error(`theme palette is a number - is query depth correct?`)
  }
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: auto;
    font-weight: auto;
  }

  :root {
    --background: ${theme.palettes.light['background']};
    --foreground: ${theme.palettes.light['foreground']};

    --card: ${theme.palettes.light['card']};
    --card-foreground: ${theme.palettes.light['card-foreground']};

    --popover: ${theme.palettes.light['popover']};
    --popover-foreground: ${theme.palettes.light['popover-foreground']};

    --primary: ${theme.palettes.light['primary']};
    --primary-foreground: ${theme.palettes.light['primary-foreground']};

    --secondary: ${theme.palettes.light['secondary']};
    --secondary-foreground: ${theme.palettes.light['secondary-foreground']};

    --muted: ${theme.palettes.light['muted']};
    --muted-foreground: ${theme.palettes.light['muted-foreground']};

    --accent: ${theme.palettes.light['accent']};
    --accent-foreground: ${theme.palettes.light['accent-foreground']};

    --destructive: ${theme.palettes.light['destructive']};
    --destructive-foreground: ${theme.palettes.light['destructive-foreground']};

    --border: ${theme.palettes.light['border']};
    --input: ${theme.palettes.light['input']};
    --ring: ${theme.palettes.light['ring']};

    --radius: ${theme.palettes.light['radius']};

    --success: ${theme.palettes.light['success']};
    --warning: ${theme.palettes.light['warning']};
    --error: ${theme.palettes.light['error']};
  }

  [data-theme='dark'] {
    --background: ${theme.palettes.dark['background']};
    --foreground: ${theme.palettes.dark['foreground']};

    --card: ${theme.palettes.dark['card']};
    --card-foreground: ${theme.palettes.dark['card-foreground']};

    --popover: ${theme.palettes.dark['popover']};
    --popover-foreground: ${theme.palettes.dark['popover-foreground']};

    --primary: ${theme.palettes.dark['primary']};
    --primary-foreground: ${theme.palettes.dark['primary-foreground']};

    --secondary: ${theme.palettes.dark['secondary']};
    --secondary-foreground: ${theme.palettes.dark['secondary-foreground']};

    --muted: ${theme.palettes.dark['muted']};
    --muted-foreground: ${theme.palettes.dark['muted-foreground']};

    --accent: ${theme.palettes.dark['accent']};
    --accent-foreground: ${theme.palettes.dark['accent-foreground']};

    --destructive: ${theme.palettes.dark['destructive']};
    --destructive-foreground: ${theme.palettes.dark['destructive-foreground']};

    --border: ${theme.palettes.dark['border']};
    --input: ${theme.palettes.dark['input']};
    --ring: ${theme.palettes.dark['ring']};

    --success: ${theme.palettes.dark['success']};
    --warning: ${theme.palettes.dark['warning']};
    --error: ${theme.palettes.dark['error']};
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground min-h-[100vh] flex flex-col;
  }
}

html {
  opacity: 0;
}

html[data-theme='dark'],
html[data-theme='light'] {
  opacity: initial;
}`
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}

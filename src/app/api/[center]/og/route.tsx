import { getImgAttrsFromMediaResource } from '@/components/Media/getImgAttrsFromMediaResource'
import { convertWebpToPng } from '@/utilities/convertWebpToPng'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import configPromise from '@payload-config'
import * as Sentry from '@sentry/nextjs'
import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'

// Color mappings copied from colors.css since CSS variables don't work in OG images
const centerColorMap = {
  nwac: {
    header: 'hsl(217 62% 21%)',
    headerForeground: 'hsl(193 42% 74%)',
  },
  sac: {
    header: 'hsl(0 2% 21%)',
    headerForeground: 'hsl(204 66% 86%)',
  },
  dvac: {
    header: 'hsl(0 0% 100%)',
    headerForeground: 'hsl(240 10% 3.9%)',
  },
  snfac: {
    header: 'hsl(0 0% 100%)',
    headerForeground: 'hsl(240 10% 3.9%)',
  },
  default: {
    header: 'hsl(0 0% 100%)',
    headerForeground: 'hsl(240 10% 3.9%)',
  },
}

const isKnownCenter = (c: string): c is keyof typeof centerColorMap => c in centerColorMap

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const searchParams = request.nextUrl.searchParams
  const routeTitle = searchParams.get('routeTitle')
  const title = searchParams.get('title')
  const description = searchParams.get('description')

  const payload = await getPayload({ config: configPromise })

  try {
    const settingsRes = await payload.find({
      collection: 'settings',
      depth: 99,
      where: {
        'tenant.slug': {
          equals: center,
        },
      },
      populate: {
        tenants: {
          slug: true,
          customDomain: true,
          name: true,
        },
      },
    })

    const settings = settingsRes.docs[0]

    if (!settings) {
      // Return a simple fallback response for unknown centers
      return new Response('Center not found', { status: 404 })
    }

    const tenant = await resolveTenant(settings.tenant, {
      select: {
        name: true,
      },
    })
    const tenantName = tenant.name || center.toUpperCase()

    const colors = isKnownCenter(center) ? centerColorMap[center] : centerColorMap.default

    let bannerImgProps = null

    if (
      settings.banner &&
      typeof settings.banner !== 'number' &&
      settings.tenant &&
      typeof settings.tenant !== 'number'
    ) {
      bannerImgProps = getImgAttrsFromMediaResource(settings.banner, settings.tenant)

      // Convert WebP to PNG if needed
      // TODO: remove this once .webp support lands in Satori: https://github.com/vercel/satori/pull/622
      if (
        settings.banner.mimeType?.toLowerCase() === 'image/webp' ||
        settings.banner.filename?.endsWith('.webp')
      ) {
        bannerImgProps.src = await convertWebpToPng(settings.banner, settings.tenant)
      }
    }

    let usfsLogoImgProps = null

    if (
      settings.usfsLogo &&
      typeof settings.usfsLogo !== 'number' &&
      settings.tenant &&
      typeof settings.tenant !== 'number'
    ) {
      usfsLogoImgProps = getImgAttrsFromMediaResource(settings.usfsLogo, settings.tenant)

      // Convert WebP to PNG if needed
      // TODO: remove this once .webp support lands in Satori: https://github.com/vercel/satori/pull/622
      if (
        settings.usfsLogo.mimeType?.toLowerCase() === 'image/webp' ||
        settings.usfsLogo.filename?.endsWith('.webp')
      ) {
        usfsLogoImgProps.src = await convertWebpToPng(settings.usfsLogo, settings.tenant)
      }
    }

    // Load font from public folder using absolute URL
    const fontUrl = new URL('/fonts/Lato-Bold.ttf', request.url)
    const fontData = await fetch(fontUrl).then((res) => res.arrayBuffer())

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.header,
            padding: '40px',
          }}
        >
          {settings?.banner && bannerImgProps && (
            <div tw="flex justify-center mb-8 gap-2 w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImgProps.src}
                alt={bannerImgProps.alt}
                width={bannerImgProps.width}
                height={bannerImgProps.height}
                style={{
                  objectFit: 'contain',
                  height: '150px',
                  width: (150 * bannerImgProps.width) / bannerImgProps.height,
                }}
              />
              {settings?.usfsLogo && usfsLogoImgProps && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={usfsLogoImgProps.src}
                  alt={usfsLogoImgProps.alt}
                  width={usfsLogoImgProps.width}
                  height={usfsLogoImgProps.height}
                  style={{
                    objectFit: 'contain',
                    height: '150px',
                  }}
                />
              )}
            </div>
          )}
          <div tw="flex flex-col items-center text-center">
            <h1
              style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                color: colors.headerForeground,
                marginBottom: '1rem',
              }}
            >
              {title ?? `${tenantName}${routeTitle ? ` - ${routeTitle}` : ''}`}
            </h1>
            <p
              style={{
                fontSize: '1.75rem',
                fontWeight: 'bold',
                color: colors.headerForeground,
                marginBottom: '1rem',
                maxWidth: '80%',
              }}
            >
              {description ?? settings.description}
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Lato',
            data: fontData,
            style: 'normal',
            weight: 600,
          },
        ],
      },
    )
  } catch (err) {
    payload.logger.error({ err }, 'Failed to generate OG image')
    Sentry.captureException(err)
    return new Response('Failed to generate OG image', {
      status: 500,
    })
  }
}

import { getImgAttrsFromMediaResource } from '@/components/Media/getImgAttrsFromMediaResource'
import { convertWebpToPng } from '@/utilities/convertWebpToPng'
import { resolveTenant } from '@/utilities/resolveTenant'
import configPromise from '@payload-config'
import * as Sentry from '@sentry/nextjs'
import { ImageResponse } from '@vercel/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
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

interface GenerateRouteImageParams {
  center: string
  routeTitle?: string
  title?: string
  subtitle?: string
}

export async function generateOGImage({
  center,
  routeTitle,
  title,
  subtitle,
}: GenerateRouteImageParams): Promise<ImageResponse> {
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
      try {
        const fallbackImageBuffer = await readFile(
          join(process.cwd(), 'public/assets/avy-web-fallback-og-image.png'),
        )
        return new Response(new Uint8Array(fallbackImageBuffer), {
          headers: {
            'Content-Type': 'image/png',
          },
        })
      } catch (fallbackErr) {
        payload.logger.error('Failed to load fallback OG image:', fallbackErr)
        return new Response('Failed to generate OG image', { status: 500 })
      }
    }

    const tenant = await resolveTenant(settings.tenant, payload, {
      select: {
        name: true,
      },
    })
    const tenantName = tenant.name || center.toUpperCase()

    const colors = centerColorMap[center as keyof typeof centerColorMap] || centerColorMap.default

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

    const latoBold = await readFile(join(process.cwd(), 'src/app/(frontend)/fonts/Lato-Bold.ttf'))

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
            <div tw="flex justify-center mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImgProps.src}
                alt={bannerImgProps.alt}
                width={bannerImgProps.width}
                height={bannerImgProps.height}
                style={{
                  objectFit: 'contain',
                  maxWidth: '600px',
                  height: Math.min(
                    bannerImgProps.height,
                    (600 * bannerImgProps.height) / bannerImgProps.width,
                  ),
                }}
              />
            </div>
          )}
          <div tw="flex flex-col items-center text-center">
            <h1
              style={{
                fontSize: '4.5rem',
                fontWeight: 'bold',
                color: colors.headerForeground,
                marginBottom: '1rem',
              }}
            >
              {title ?? `${tenantName}${routeTitle ? ` - ${routeTitle}` : ''}`}
            </h1>
            <p
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: colors.headerForeground,
                marginBottom: '1rem',
                maxWidth: '80%',
              }}
            >
              {subtitle ?? settings.description}
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
            data: latoBold,
            style: 'normal',
            weight: 600,
          },
        ],
      },
    )
  } catch (err) {
    payload.logger.error(err)
    Sentry.captureException(err)
    return new Response('Failed to generate OG image', {
      status: 500,
    })
  }
}

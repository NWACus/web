import { getImgAttrsFromMediaResource } from '@/components/Media/getImgAttrsFromMediaResource'
import { convertWebpToPng } from '@/utilities/convertWebpToPng'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
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
  description?: string
}

export async function generateOGImage({
  center,
  routeTitle,
  title,
  description,
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
        payload.logger.error({ err: fallbackErr }, 'Failed to load fallback OG image')
        return new Response('Failed to generate OG image', { status: 500 })
      }
    }

    const tenant = await resolveTenant(settings.tenant, {
      select: {
        name: true,
      },
    })
    const tenantName = tenant.name || center.toUpperCase()

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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

    const latoBold = await readFile(join(process.cwd(), 'src/app/(frontend)/fonts/Lato-Bold.ttf'))

    return new ImageResponse(
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
      </div>,
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
    payload.logger.error({ err }, 'Failed to generate OG image')
    Sentry.captureException(err)
    return new Response('Failed to generate OG image', {
      status: 500,
    })
  }
}

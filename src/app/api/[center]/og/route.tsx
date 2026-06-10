import { getImgAttrsFromMediaResource } from '@/components/Media/getImgAttrsFromMediaResource'
import { getForecastZoneDanger } from '@/services/nac/nac'
import { MapLayerFeatureProperties } from '@/services/nac/types/schemas'
import { convertWebpToPng } from '@/utilities/convertWebpToPng'
import { formatZoneName } from '@/utilities/formatZoneName'
import { getURL } from '@/utilities/getURL'
import { resolveTenant } from '@/utilities/tenancy/resolveTenant'
import configPromise from '@payload-config'
import * as Sentry from '@sentry/nextjs'
import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { centerColorMap, isKnownCenter } from './centerColorMap'

const FORECAST_ZONE_PATH_PREFIX = 'forecasts/avalanche/'

function getDangerBadge(danger: MapLayerFeatureProperties) {
  const hasRating = danger.danger_level >= 1 && danger.danger_level <= 5
  const label = danger.danger ? toTitleCase(danger.danger) : hasRating ? '' : 'No Rating'

  return {
    level: hasRating ? String(danger.danger_level) : null,
    label,
    background: danger.color || '#888888',
    foreground: danger.font_color || '#ffffff',
    travelAdvice: danger.travel_advice || null,
    iconFile: hasRating ? `${danger.danger_level}.png` : 'no-rating.png',
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ center: string }> },
) {
  const { center } = await params
  const searchParams = request.nextUrl.searchParams
  const routeTitle = searchParams.get('routeTitle')
  const title = searchParams.get('title')
  const description = searchParams.get('description')
  const route = searchParams.get('route')
  const zone =
    route && route.startsWith(FORECAST_ZONE_PATH_PREFIX)
      ? (route.slice(FORECAST_ZONE_PATH_PREFIX.length).split('/').filter(Boolean).pop() ?? null)
      : null

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

    // Header logos are smaller on zone pages to leave room for the danger badge below.
    const logoHeight = zone ? 80 : 150

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

    // Forecast zone shares: fetch the zone's current danger rating + travel advice
    let dangerBadge: ReturnType<typeof getDangerBadge> | null = null
    let dangerIconSrc: string | null = null
    let zoneName: string | null = null

    if (zone) {
      zoneName = formatZoneName(zone)

      try {
        const danger = await getForecastZoneDanger(center, zone)
        if (danger) {
          dangerBadge = getDangerBadge(danger)
        }
      } catch (err) {
        payload.logger.error({ err }, `Failed to fetch danger for OG image (zone: ${zone})`)
        Sentry.captureException(err)
      }

      if (dangerBadge) {
        dangerIconSrc = new URL(`/assets/dangerIcons/${dangerBadge.iconFile}`, getURL()).toString()
      }
    }

    // Load font from public folder using root domain URL
    const fontUrl = new URL('/fonts/Lato-Bold.ttf', getURL())
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
            <div tw="flex items-center mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImgProps.src}
                alt={bannerImgProps.alt}
                width={bannerImgProps.width}
                height={bannerImgProps.height}
                style={{
                  objectFit: 'contain',
                  height: logoHeight,
                  width: (logoHeight * bannerImgProps.width) / bannerImgProps.height,
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
                    height: logoHeight,
                    width: (logoHeight * usfsLogoImgProps.width) / usfsLogoImgProps.height,
                    // Satori (Yoga) ignores flex `gap`, so space the logo from the banner with margin
                    marginLeft: 24,
                  }}
                />
              )}
            </div>
          )}
          {zoneName ? (
            <div tw="flex flex-col items-center text-center">
              <h1
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 'bold',
                  color: colors.headerForeground,
                  marginBottom: 0,
                }}
              >
                {zoneName}
              </h1>
              <p
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 'bold',
                  color: colors.headerForeground,
                  marginBottom: '1.5rem',
                }}
              >
                Avalanche Forecast
              </p>
              {dangerBadge && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 0,
                  }}
                >
                  {dangerIconSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dangerIconSrc}
                      alt={
                        dangerBadge.level
                          ? `Avalanche danger level ${dangerBadge.level}`
                          : 'No avalanche danger rating'
                      }
                      width={175}
                      height={150}
                      style={{ objectFit: 'contain', marginRight: '28px' }}
                    />
                  )}
                  <div
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                  >
                    {dangerBadge.level && (
                      <div
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 'bold',
                          color: colors.headerForeground,
                          letterSpacing: '2px',
                          marginBottom: '6px',
                        }}
                      >
                        DANGER LEVEL
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: dangerBadge.background,
                        color: dangerBadge.foreground,
                        borderRadius: '14px',
                        padding: '10px 28px',
                      }}
                    >
                      {dangerBadge.level && (
                        <div
                          style={{
                            fontSize: '3.25rem',
                            fontWeight: 'bold',
                            lineHeight: 1,
                            marginRight: dangerBadge.label ? '1rem' : 0,
                          }}
                        >
                          {dangerBadge.level}
                        </div>
                      )}
                      {dangerBadge.label && (
                        <div
                          style={{
                            fontSize: '1.85rem',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                          }}
                        >
                          {dangerBadge.label.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {dangerBadge?.travelAdvice && (
                <p
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: colors.headerForeground,
                    maxWidth: '70%',
                    lineHeight: 1.3,
                  }}
                >
                  {dangerBadge.travelAdvice}
                </p>
              )}
            </div>
          ) : (
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
          )}
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
            weight: 700,
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

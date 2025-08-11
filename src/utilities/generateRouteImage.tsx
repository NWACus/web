import type { Media } from '@/payload-types'
import configPromise from '@payload-config'
import { ImageResponse } from '@vercel/og'
import { getPayload } from 'payload'
import { getURL } from './getURL'

export type RouteType = 'landing' | 'forecasts' | 'observations' | 'weather' | 'blog'
export type Platform = 'og' | 'twitter'

interface GenerateRouteImageParams {
  params: { center: string }
  type: RouteType
  platform: Platform
  title?: string
  subtitle?: string
}

interface TenantData {
  name: string
  settings?: {
    logo?: Media
    ogImage?: Media
  }
}

export async function generateRouteImage({
  params,
  type,
  platform,
  title,
  subtitle,
}: GenerateRouteImageParams): Promise<ImageResponse> {
  const { center } = params

  let tenantData: TenantData | null = null

  try {
    const payload = await getPayload({ config: configPromise })

    const tenantsRes = await payload.find({
      collection: 'tenants',
      where: {
        slug: {
          equals: center,
        },
      },
      select: {
        name: true,
        logo: true,
      },
    })

    if (tenantsRes.docs.length > 0) {
      const tenant = tenantsRes.docs[0]

      const settingsRes = await payload.find({
        collection: 'settings',
        where: {
          'tenant.slug': {
            equals: center,
          },
        },
        select: {
          logo: true,
          ogImage: true,
        },
      })

      tenantData = {
        name: tenant.name || center.toUpperCase(),
        settings:
          settingsRes.docs.length > 0
            ? {
                logo: settingsRes.docs[0].logo as Media,
                ogImage: settingsRes.docs[0].ogImage as Media,
              }
            : undefined,
      }
    }
  } catch (error) {
    console.error('Error fetching tenant data for OG image:', error)
  }

  if (!tenantData) {
    tenantData = {
      name: center.toUpperCase(),
    }
  }

  const routeTitles: Record<RouteType, string> = {
    landing: tenantData.name,
    forecasts: 'Avalanche Forecasts',
    observations: 'Avalanche Observations',
    weather: 'Weather Stations',
    blog: 'Blog',
  }

  const displayTitle = title || routeTitles[type]
  const displaySubtitle = subtitle || (type !== 'landing' ? tenantData.name : undefined)

  const logoUrl = tenantData.settings?.logo?.url
    ? `${getURL()}${tenantData.settings.logo.url}`
    : null

  if (tenantData.settings?.ogImage?.url && type === 'landing') {
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
            backgroundColor: '#ffffff',
            backgroundImage: `url(${getURL()}${tenantData.settings.ogImage.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ),
      {
        width: platform === 'twitter' ? 1200 : 1200,
        height: platform === 'twitter' ? 600 : 630,
      },
    )
  }

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
          backgroundColor: '#1a365d',
          backgroundImage: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '32px',
            marginBottom: '32px',
          }}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'contain',
              }}
            />
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: logoUrl ? 'flex-start' : 'center',
              color: 'white',
            }}
          >
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p
                style={{
                  fontSize: '36px',
                  margin: '16px 0 0 0',
                  opacity: 0.9,
                }}
              >
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: platform === 'twitter' ? 1200 : 1200,
      height: platform === 'twitter' ? 600 : 630,
    },
  )
}

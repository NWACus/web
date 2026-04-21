'use server'

import { centerColorMap } from '@/app/api/[center]/og/centerColorMap'
import {
  PAGES_TO_PROVISION,
  provision,
  resolveBuiltInPages,
} from '@/collections/Tenants/endpoints/provisionTenant'
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

export type ProvisioningStatus = {
  forecastPages: { count: number; expected: number }
  defaultBuiltInPages: { count: number; expected: number }
  pages: { created: number; expected: number; missing: string[] }
  homePage: boolean
  navigation: boolean
  settings: { exists: boolean; id?: number | string }
  theme: { brandColors: boolean; ogColors: boolean }
}

export async function checkProvisioningStatusAction(
  tenantId: number | string,
): Promise<{ status: ProvisioningStatus } | { error: string }> {
  try {
    const payload = await getPayload({ config })

    const [builtInPages, pages, homePages, navigations, settings, tenant, brandColors] =
      await Promise.all([
        payload.find({
          collection: 'builtInPages',
          where: { tenant: { equals: tenantId } },
          limit: 100,
          select: { url: true },
        }),
        payload.find({
          collection: 'pages',
          where: { tenant: { equals: tenantId } },
          limit: 500,
          select: { slug: true, title: true, _status: true },
        }),
        payload.find({
          collection: 'homePages',
          where: { tenant: { equals: tenantId } },
          limit: 0,
        }),
        payload.find({
          collection: 'navigations',
          where: { tenant: { equals: tenantId } },
          limit: 0,
        }),
        payload.find({
          collection: 'settings',
          where: { tenant: { equals: tenantId } },
          limit: 1,
          select: {},
        }),
        payload.findByID({
          collection: 'tenants',
          id: tenantId,
        }),
        fs
          .readFile(path.join(process.cwd(), 'src/app/(frontend)/colors.css'), 'utf-8')
          .catch((err) => {
            payload.logger.warn(
              `Failed to read colors.css: ${err instanceof Error ? err.message : err}`,
            )
            return ''
          }),
      ])

    const { forecastPages: expectedForecastPages, nonForecastPages: expectedNonForecastPages } =
      await resolveBuiltInPages(tenant.slug, payload.logger)

    const tenantForecastPageCount = builtInPages.docs.filter((p) =>
      p.url.startsWith('/forecasts/avalanche'),
    ).length
    const tenantDefaultPageCount = builtInPages.docs.filter(
      (p) => !p.url.startsWith('/forecasts/avalanche'),
    ).length

    const tenantPagesBySlug = new Map(pages.docs.map((p) => [p.slug, p]))
    const createdPages = PAGES_TO_PROVISION.filter((p) => tenantPagesBySlug.has(p.slug))
    const missing = PAGES_TO_PROVISION.filter((p) => !tenantPagesBySlug.has(p.slug))

    return {
      status: {
        forecastPages: {
          count: tenantForecastPageCount,
          expected: expectedForecastPages.length,
        },
        defaultBuiltInPages: {
          count: tenantDefaultPageCount,
          expected: expectedNonForecastPages.length,
        },
        pages: {
          created: createdPages.length,
          expected: PAGES_TO_PROVISION.length,
          missing: missing.map((p) => p.title),
        },
        homePage: homePages.totalDocs > 0,
        navigation: navigations.totalDocs > 0,
        settings: {
          exists: settings.totalDocs > 0,
          id: settings.docs[0]?.id,
        },
        theme: {
          // Check if a CSS class matching the tenant slug exists in colors.css (e.g. ".dvac {")
          brandColors: brandColors.includes(`.${tenant.slug} {`),
          // Check if the tenant slug exists as a key in centerColorMap in the OG route
          ogColors: tenant.slug in centerColorMap,
        },
      },
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to check provisioning status' }
  }
}

export async function runProvisionAction(
  tenantId: number | string,
): Promise<{ success: true; failedPages: string[] } | { error: string }> {
  const payload = await getPayload({ config })
  try {
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantId,
    })

    const result = await provision(payload, tenant)

    return { success: true, failedPages: result.failedPages }
  } catch (err) {
    payload.logger.error({ err }, 'Provisioning failed')
    return { error: err instanceof Error ? err.message : 'Failed to run provisioning' }
  }
}

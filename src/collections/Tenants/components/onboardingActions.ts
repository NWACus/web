'use server'

import {
  BUILT_IN_PAGES,
  provision,
  SKIP_PAGE_SLUGS,
} from '@/collections/Tenants/endpoints/provisionTenant'
import config from '@payload-config'
import fs from 'fs/promises'
import path from 'path'
import { getPayload } from 'payload'

export type ProvisioningStatus = {
  builtInPages: { count: number; expected: number }
  pages: { copied: number; expected: number; missing: string[]; skipped: string[] }
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

    // Template tenant slug must match TEMPLATE_TENANT_SLUG in provisionTenant.ts
    const templateTenantSlug = 'dvac'

    const [
      builtInPages,
      pages,
      homePages,
      navigations,
      settings,
      tenant,
      brandColors,
      ogRouteFile,
      templateTenantResult,
    ] = await Promise.all([
      payload.find({
        collection: 'builtInPages',
        where: { tenant: { equals: tenantId } },
        limit: 0,
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
        .catch(() => ''),
      fs
        .readFile(path.join(process.cwd(), 'src/app/api/[center]/og/route.tsx'), 'utf-8')
        .catch(() => ''),
      payload.find({
        collection: 'tenants',
        where: { slug: { equals: templateTenantSlug } },
        limit: 1,
      }),
    ])

    const templateTenant = templateTenantResult.docs[0]

    let templatePageSlugs: { slug: string; title: string }[] = []
    const skippedPages: string[] = []
    if (templateTenant) {
      const templatePages = await payload.find({
        collection: 'pages',
        where: {
          tenant: { equals: templateTenant.id },
          _status: { equals: 'published' },
        },
        limit: 500,
        select: { slug: true, title: true },
      })
      // Only exclude demo/showcase pages — pages with all tenant-scoped blocks
      // are still copied as blank drafts by the provisioner
      templatePageSlugs = templatePages.docs
        .filter((p) => {
          if (SKIP_PAGE_SLUGS.has(p.slug)) {
            skippedPages.push(p.title)
            return false
          }
          return true
        })
        .map((p) => ({ slug: p.slug, title: p.title }))
    }

    const tenantPagesBySlug = new Map(pages.docs.map((p) => [p.slug, p]))
    const copiedPages = templatePageSlugs.filter((p) => tenantPagesBySlug.has(p.slug))
    const missing = templatePageSlugs.filter((p) => !tenantPagesBySlug.has(p.slug))

    return {
      status: {
        builtInPages: { count: builtInPages.totalDocs, expected: BUILT_IN_PAGES.length },
        pages: {
          copied: copiedPages.length,
          expected: templatePageSlugs.length,
          missing: missing.map((p) => p.title),
          skipped: skippedPages,
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
          ogColors: ogRouteFile.includes(`${tenant.slug}:`),
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

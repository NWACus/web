/**
 * The preamble every built-in per-center route page shares: the tenant list that drives static
 * params, and the metadata shape (parent-title suffix, canonical, OpenGraph, dynamic OG image).
 *
 * These pages are structurally identical apart from a label, a path, and whether they carry an OG
 * image, so keeping the shape here means a change to the title format or the OG wiring lands in
 * one place rather than six.
 */
import { getAvalancheCenterPlatforms } from '@/services/nac/nac'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata, ResolvedMetadata } from 'next/types'
import { getPayload } from 'payload'

/** The route params every per-center page under `(frontend)/[center]` receives. */
export interface CenterPathArgs {
  center: string
}

export interface CenterRouteArgs {
  params: Promise<CenterPathArgs>
}

type CenterPlatform = keyof Awaited<ReturnType<typeof getAvalancheCenterPlatforms>>

/**
 * 404 unless the center publishes this platform. A center that doesn't run, say, an observations
 * platform shouldn't have an empty observations page — it shouldn't have the route at all.
 */
export async function assertCenterPlatform(center: string, platform: CenterPlatform) {
  const avalancheCenterPlatforms = await getAvalancheCenterPlatforms(center)

  if (!avalancheCenterPlatforms[platform]) {
    notFound()
  }
}

/** Static params for every tenant, as `{ center: slug }`. */
export async function centerStaticParams(): Promise<{ center: string }[]> {
  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 1000,
    select: {
      slug: true,
    },
  })

  return tenants.docs.map((tenant) => ({ center: tenant.slug }))
}

/**
 * The parent layout's title, unwrapped from Next's `absolute`/`template` form so it can be used
 * as a plain suffix.
 */
function parentTitleOf(parentMeta: ResolvedMetadata): ResolvedMetadata['title'] | string | null {
  const { title } = parentMeta
  if (title && typeof title !== 'string' && 'absolute' in title) return title.absolute

  return title
}

export interface CenterRouteMetadataArgs {
  parent: Promise<ResolvedMetadata>
  /** The page's own name, e.g. "Forecasts" — becomes `"{label} | {parent title}"`. */
  label: string
  /** Tenant-relative path, e.g. `/forecasts/avalanche`. Used as canonical and OG url. */
  path: string
  /**
   * Center slug. When supplied, the page gets a dynamic OG image from `/api/{center}/og`; pages
   * that inherit the parent's image (e.g. Events) omit it.
   */
  center?: string
  /** OG image caption, when it differs from `label` (e.g. "Avalanche Forecast" for "Forecasts"). */
  ogRouteTitle?: string
}

export async function centerRouteMetadata({
  parent,
  label,
  path,
  center,
  ogRouteTitle,
}: CenterRouteMetadataArgs): Promise<Metadata> {
  const parentMeta = await parent
  const title = `${label} | ${parentTitleOf(parentMeta)}`

  return {
    title,
    alternates: {
      canonical: path,
    },
    openGraph: {
      ...parentMeta.openGraph,
      title,
      url: path,
      ...ogImage(center, ogRouteTitle ?? label),
    },
  }
}

function ogImage(center: string | undefined, routeTitle: string) {
  if (!center) return {}

  return {
    images: [
      {
        url: `/api/${center}/og?routeTitle=${encodeURIComponent(routeTitle)}`,
        width: 1200,
        height: 630,
      },
    ],
  }
}

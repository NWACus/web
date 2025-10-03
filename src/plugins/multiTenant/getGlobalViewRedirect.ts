/* eslint-disable @typescript-eslint/no-invalid-void-type */
import type { CollectionSlug, Payload, TypedUser, ViewTypes } from 'payload'

import { formatAdminURL } from 'payload/shared'

import { getCollectionIDType } from './getCollectionIDType'
import { getTenantFromCookie } from './getTenantFromCookie'
import { findTenantOptions } from './queries/findTenantOptions'

type Args = {
  basePath?: string
  docID?: number | string
  headers: Headers
  payload: Payload
  slug: CollectionSlug
  tenantFieldName: string
  tenantsCollectionSlug: CollectionSlug
  useAsTitle: string
  user?: TypedUser
  view: ViewTypes
}
export async function getGlobalViewRedirect({
  slug,
  basePath,
  docID,
  headers,
  payload,
  tenantFieldName,
  tenantsCollectionSlug,
  useAsTitle,
  user,
  view,
}: Args): Promise<string | void> {
  const idType = getCollectionIDType({
    collectionSlug: tenantsCollectionSlug,
    payload,
  })
  let tenant = getTenantFromCookie(headers, idType)
  let redirectRoute: `/${string}` | void = undefined

  if (!tenant) {
    const tenantsQuery = await findTenantOptions({
      limit: 1,
      payload,
      tenantsCollectionSlug,
      useAsTitle,
      user,
    })

    tenant = tenantsQuery.docs[0]?.id || null
  }

  try {
    const { docs } = await payload.find({
      collection: slug,
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user,
      where: {
        [tenantFieldName]: {
          equals: tenant,
        },
      },
    })

    const tenantDocID = docs?.[0]?.id

    if (view === 'document') {
      if (docID && !tenantDocID) {
        // viewing a document with an id but does not match the selected tenant, redirect to create route
        redirectRoute = `/collections/${slug}/create`
      } else if (tenantDocID && docID !== tenantDocID) {
        // tenant document already exists but does not match current route doc ID, redirect to matching tenant doc
        redirectRoute = `/collections/${slug}/${tenantDocID}`
      }
    } else if (view === 'list') {
      if (tenantDocID) {
        // tenant document exists, redirect to edit view
        redirectRoute = `/collections/${slug}/${tenantDocID}`
      } else {
        // tenant document does not exist, redirect to create route
        redirectRoute = `/collections/${slug}/create`
      }
    }
  } catch (e: unknown) {
    payload.logger.error(
      e,
      `${typeof e === 'object' && e && 'message' in e ? `e?.message - ` : ''}Multi Tenant Redirect Error`,
    )
  }

  if (redirectRoute) {
    return formatAdminURL({
      adminRoute: payload.config.routes.admin,
      basePath,
      path: redirectRoute,
      serverURL: payload.config.serverURL,
    })
  }

  return undefined
}

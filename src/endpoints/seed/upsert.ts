import { Tenant } from '@/payload-types'
import { removeNonDeterministicKeys } from '@/utilities/removeNonDeterministicKeys'
import crypto from 'crypto'
import stringify from 'json-stable-stringify'
import { merge } from 'lodash-es'
import { SelectFromCollectionSlug } from 'node_modules/payload/dist/collections/config/types'
import { ByIDOptions } from 'node_modules/payload/dist/collections/operations/local/update'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  File,
  Payload,
  RequiredDataFromCollectionSlug,
} from 'payload'

type GlobalCollectionWithHash = Extract<
  CollectionSlug,
  'users' | 'tenants' | 'roles' | 'globalRoles' | 'providers' | 'courses'
>

export async function upsertGlobals<TSlug extends GlobalCollectionWithHash>(
  collection: TSlug,
  payload: Payload,
  incremental: boolean,
  keyFunc: (obj: RequiredDataFromCollectionSlug<TSlug> | DataFromCollectionSlug<TSlug>) => string,
  input: RequiredDataFromCollectionSlug<TSlug>[],
): Promise<Record<string, DataFromCollectionSlug<TSlug>>> {
  payload.logger.info(`— Seeding ${collection}...`)
  const output: Record<string, DataFromCollectionSlug<TSlug>> = {}
  const existing: Record<string, DataFromCollectionSlug<TSlug>> = {}
  if (incremental) {
    const data = await payload.find({
      collection: collection,
      limit: 1000,
      depth: 0,
    })
    for (const item of data.docs) {
      existing[keyFunc(item)] = item
    }
  }
  for (const item of input) {
    const key = keyFunc(item)
    const representation = stringify(removeNonDeterministicKeys(JSON.parse(JSON.stringify(item))))
    if (!representation) {
      throw new Error(`Creating stable serialization of ${collection}['${key}'] failed...`)
    }
    const hash = crypto.createHash('sha256').update(representation).digest('hex')
    item.contentHash = hash
    if (incremental) {
      if (key in existing && existing[key].contentHash === hash) {
        payload.logger.info(`Skipping no-op update to ${collection}['${key}']...`)
        output[key] = existing[key]
        continue
      } else if (key in existing && existing[key].contentHash !== hash) {
        payload.logger.info(
          `Updating ${key} ${collection} as previous hash ${existing[key].contentHash} does not match current hash ${hash}...`,
        )
        payload.logger.info(representation)
        const updated = await payload.update({
          id: existing[key].id,
          collection: collection,
          data: merge(existing[key], item) as ByIDOptions<
            TSlug,
            SelectFromCollectionSlug<TSlug>
          >['data'],
          context: {
            disableRevalidate: true,
          },
        })

        if (!updated) {
          throw new Error(
            `Updating ${key} ${collection} returned no object: ${JSON.stringify(updated)}...`,
          )
        }
        output[key] = updated
        continue
      }
    }
    payload.logger.info(
      `Creating ${collection}['${key}'] with hash ${item.contentHash.slice(0, 8)}...`,
    )
    const created = await payload.create({
      collection: collection,
      data: item,
      context: {
        disableRevalidate: true,
      },
    })

    if (!created) {
      throw new Error(`Creating ${collection}['${key}'] returned null...`)
    }
    output[key] = created
  }
  return output
}

type TenantScopedCollectionWithHash = Exclude<
  CollectionSlug,
  | GlobalCollectionWithHash
  | 'forms'
  | 'form-submissions'
  | 'redirects'
  | 'payload-locked-documents'
  | 'payload-preferences'
  | 'payload-migrations'
  | 'globalRoleAssignments'
  | 'payload-kv'
>

export async function upsert<TSlug extends TenantScopedCollectionWithHash>(
  collection: TSlug,
  payload: Payload,
  incremental: boolean,
  tenantsById: Record<number, Tenant>,
  keyFunc: (obj: RequiredDataFromCollectionSlug<TSlug> | DataFromCollectionSlug<TSlug>) => string,
  input:
    | { data: RequiredDataFromCollectionSlug<TSlug>; file: File }[]
    | RequiredDataFromCollectionSlug<TSlug>[],
): Promise<Record<string, Record<string, DataFromCollectionSlug<TSlug>>>> {
  payload.logger.info(`— Seeding ${collection}...`)
  const output: Record<string, Record<string, DataFromCollectionSlug<TSlug>>> = {}
  const existing: Record<string, Record<string, DataFromCollectionSlug<TSlug>>> = {}
  if (incremental) {
    payload.logger.info(`— Fetching existing ${collection}...`)
    const data = await payload.find({
      collection: collection,
      limit: 1000,
      depth: 0,
    })
    for (const item of data.docs) {
      const key = keyFunc(item)
      const tenant = item.tenant
      // Handle optional tenant - use '__global__' for items without tenant
      const tenantSlug =
        tenant === null || tenant === undefined
          ? '__global__'
          : typeof tenant == 'object'
            ? tenant.slug
            : (tenantsById[tenant]?.slug ?? '__global__')
      if (!(tenantSlug in existing)) {
        existing[tenantSlug] = {}
      }
      existing[tenantSlug][key] = item
    }
  }
  for (const data of input) {
    const item: RequiredDataFromCollectionSlug<TSlug> = 'file' in data ? data.data : data
    const file: File | undefined = 'file' in data ? data.file : undefined
    const key = keyFunc(item)
    // Handle optional tenant - use '__global__' for items without tenant
    let tenant: string = '__global__'
    if (item.tenant === null || item.tenant === undefined) {
      tenant = '__global__'
    } else if (typeof item.tenant === 'number') {
      tenant = tenantsById[item.tenant]?.slug ?? '__global__'
    } else {
      tenant = item.tenant.slug
    }
    const representation = stringify(removeNonDeterministicKeys(JSON.parse(JSON.stringify(item))))
    if (!representation) {
      throw new Error(
        `Creating stable serialization of ${collection}['${tenant}']['${key}'] failed...`,
      )
    }
    const hash = crypto.createHash('sha256').update(representation).digest('hex')
    item.contentHash = hash
    if (incremental) {
      if (
        tenant in existing &&
        key in existing[tenant] &&
        existing[tenant][key].contentHash === hash
      ) {
        payload.logger.info(`Skipping no-op update to ${collection}['${tenant}']['${key}']...`)
        if (!(tenant in output)) {
          output[tenant] = {}
        }
        output[tenant][key] = existing[tenant][key]
        continue
      } else if (
        tenant in existing &&
        key in existing[tenant] &&
        existing[tenant][key].contentHash !== hash
      ) {
        payload.logger.info(
          `Updating ${collection}['${tenant}']['${key}'] as previous hash ${existing[tenant][key].contentHash} does not match current hash ${hash}...`,
        )
        payload.logger.info(representation)
        const updated = await payload.update({
          id: existing[tenant][key].id,
          collection: collection,
          data: merge(existing[tenant][key], item) as ByIDOptions<
            TSlug,
            SelectFromCollectionSlug<TSlug>
          >['data'],
          context: {
            disableRevalidate: true,
          },
        })

        if (!updated) {
          throw new Error(
            `Updating ${collection}['${tenant}']['${key}'] returned no object: ${JSON.stringify(updated)}...`,
          )
        }
        if (!(tenant in output)) {
          output[tenant] = {}
        }
        output[tenant][key] = updated
        continue
      }
    }
    payload.logger.info(
      `Creating ${collection}['${tenant}']['${key}'] with hash ${item.contentHash.slice(0, 8)}...`,
    )
    const created = await payload.create({
      collection: collection,
      data: item,
      file: file,
      context: {
        disableRevalidate: true,
      },
    })

    if (!created) {
      throw new Error(`Creating ${collection}['${tenant}']['${key}'] returned null...`)
    }
    if (!(tenant in output)) {
      output[tenant] = {}
    }
    output[tenant][key] = created
  }
  return output
}

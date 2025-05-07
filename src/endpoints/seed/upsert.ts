import { Tenant } from '@/payload-types'
import crypto from 'crypto'
import stringify from 'json-stable-stringify'
import merge from 'lodash.merge'
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
  'users' | 'tenants' | 'roles' | 'globalRoleAssignments' | 'themes' | 'palettes'
>

const removeNonDeterministicKeys = (obj: object): object => {
  if (obj !== Object(obj)) {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map((item: object): object => removeNonDeterministicKeys(item))
  }

  return Object.keys(obj as object)
    .filter((k) => !['loginAt', 'createdAt', 'updatedAt', 'publishedAt', 'contentHash'].includes(k))
    .reduce(
      // @ts-expect-error this is so nasty anyway, yuck
      (acc: object, x): object => Object.assign(acc, { [x]: removeNonDeterministicKeys(obj[x]) }),
      {} as object,
    )
}

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
      payload.logger.error(`Creating stable serialization of ${collection}['${key}'] failed...`)
      throw new Error()
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
        const updated = await payload
          .update({
            id: existing[key].id,
            collection: collection,
            data: merge(existing[key], item) as ByIDOptions<
              TSlug,
              SelectFromCollectionSlug<TSlug>
            >['data'],
          })
          .catch((e) => payload.logger.error(e))

        if (!updated) {
          payload.logger.error(
            `Updating ${key} ${collection} returned no object: ${JSON.stringify(updated)}...`,
          )
          throw new Error()
        }
        output[key] = updated
        continue
      }
    }
    payload.logger.info(
      `Creating ${collection}['${key}'] with hash ${item.contentHash.slice(0, 8)}...`,
    )
    const created = await payload
      .create({
        collection: collection,
        data: item,
      })
      .catch((e) => payload.logger.error(e))

    if (!created) {
      payload.logger.error(`Creating ${collection}['${key}'] returned null...`)
      throw new Error()
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
  | 'search'
  | 'payload-locked-documents'
  | 'payload-preferences'
  | 'payload-migrations'
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
      const tenantSlug = typeof tenant == 'object' ? tenant.slug : tenantsById[tenant].slug
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
    let tenant: string = ''
    if (typeof item.tenant === 'number') {
      tenant = tenantsById[item.tenant].slug
    } else {
      tenant = item.tenant.slug
    }
    const representation = stringify(removeNonDeterministicKeys(JSON.parse(JSON.stringify(item))))
    if (!representation) {
      payload.logger.error(
        `Creating stable serialization of ${collection}['${tenant}']['${key}'] failed...`,
      )
      throw new Error()
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
        const updated = await payload
          .update({
            id: existing[tenant][key].id,
            collection: collection,
            data: merge(existing[tenant][key], item) as ByIDOptions<
              TSlug,
              SelectFromCollectionSlug<TSlug>
            >['data'],
          })
          .catch((e) => payload.logger.error(e))

        if (!updated) {
          payload.logger.error(
            `Updating ${collection}['${tenant}']['${key}'] returned no object: ${JSON.stringify(updated)}...`,
          )
          throw new Error()
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
    const created = await payload
      .create({
        collection: collection,
        data: item,
        file: file,
      })
      .catch((e) => payload.logger.error(e))

    if (!created) {
      payload.logger.error(`Creating ${collection}['${tenant}']['${key}'] returned null...`)
      throw new Error()
    }
    if (!(tenant in output)) {
      output[tenant] = {}
    }
    output[tenant][key] = created
  }
  return output
}

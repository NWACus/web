import { Role } from '@/payload-types'
import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload, RequiredDataFromCollectionSlug } from 'payload'

export const maxDuration = 120 // seconds

export async function POST(): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  // Authenticate by passing request headers
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user) {
    return new Response('Action forbidden.', { status: 403 })
  }

  try {
    payload.logger.info(`— Seeding role...`)

    const roleData: RequiredDataFromCollectionSlug<'roles'>[] = [
      {
        name: 'Admin',
        rules: [
          {
            collections: ['*'],
            actions: ['*'],
          },
        ],
      },
    ]
    const roles: Record<string, Role> = {}
    for (const data of roleData) {
      payload.logger.info(`Creating ${data.name} role...`)
      const role = await payload
        .create({
          collection: 'roles',
          data: data,
        })
        .catch((e) => payload.logger.error(e))

      if (!role) {
        payload.logger.error(`Creating ${data.name} role returned null...`)
        return new Response('Error seeding data.', { status: 500 })
      }
      roles[data.name] = role
    }

    payload.logger.info(`— Seeding global role assignments...`)

    const _superAdminRoleAssignment = await payload
      .create({
        collection: 'globalRoleAssignments',
        data: {
          roles: [roles['Admin']],
          user: user,
        },
      })
      .catch((e) => payload.logger.error(e))

    payload.logger.info(`— Seeding tenants...`)

    const tenantData: RequiredDataFromCollectionSlug<'tenants'>[] = [
      {
        name: 'Northwest Avalanche Center',
        slug: 'nwac',
        domains: [{ domain: 'nwac.us' }],
      },
      {
        name: 'Sierra Avalanche Center',
        slug: 'sac',
        domains: [{ domain: 'sierraavalanchecenter.org' }],
      },
      {
        name: 'Sawtooth Avalanche Center',
        slug: 'snfac',
        domains: [{ domain: 'sawtoothavalanche.com' }],
      },
    ]
    for (const data of tenantData) {
      payload.logger.info(`Creating ${data.name} tenant returned...`)
      const tenant = await payload
        .create({
          collection: 'tenants',
          data: data,
        })
        .catch((e) => payload.logger.error(e))

      if (!tenant) {
        payload.logger.error(`Creating ${data.name} tenant returned null...`)
        return new Response('Error seeding data.', { status: 500 })
      }
    }

    return Response.json({ success: true })
  } catch {
    return new Response('Error seeding data.', { status: 500 })
  }
}

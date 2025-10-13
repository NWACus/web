import { GlobalRole, User } from '@/payload-types'
import { Payload, RequiredDataFromCollectionSlug } from 'payload'

export const bootstrap = async ({
  payload,
  user,
}: {
  payload: Payload
  user: User
}): Promise<void> => {
  payload.logger.info(`— Seeding global role...`)

  const globalRoleData: RequiredDataFromCollectionSlug<'globalRoles'>[] = [
    {
      name: 'Super Admin',
      rules: [
        {
          collections: ['*'],
          actions: ['*'],
        },
      ],
    },
  ]
  const globalRoles: Record<string, GlobalRole> = {}
  for (const data of globalRoleData) {
    payload.logger.info(`Creating ${data.name} global role...`)
    const globalRole = await payload.create({
      collection: 'globalRoles',
      data: data,
      context: {
        disableRevalidate: true,
      },
    })

    if (!globalRole) {
      throw new Error(`Creating ${data.name} global role returned null...`)
    }
    globalRoles[data.name] = globalRole
  }

  payload.logger.info(`— Assigning global roles to user...`)

  // Assign Super Admin global role to user via GlobalRoleAssignments
  try {
    await payload.create({
      collection: 'globalRoleAssignments',
      data: {
        user: user.id,
        globalRole: globalRoles['Super Admin'].id,
      },
      context: {
        disableRevalidate: true,
      },
    })
  } catch (error) {
    payload.logger.warn(`Could not assign global role to user ${user.id}: ${error}`)
    // Continue with bootstrap even if this fails
  }

  payload.logger.info(`— Seeding tenants...`)

  const tenantData: RequiredDataFromCollectionSlug<'tenants'>[] = [
    {
      name: 'Death Valley Avalanche Center',
      slug: 'dvac',
      customDomain: 'dvac.us',
    },
    {
      name: 'Northwest Avalanche Center',
      slug: 'nwac',
      customDomain: 'nwac.us',
    },
    {
      name: 'Sierra Avalanche Center',
      slug: 'sac',
      customDomain: 'sierraavalanchecenter.org',
    },
    {
      name: 'Sawtooth Avalanche Center',
      slug: 'snfac',
      customDomain: 'sawtoothavalanche.com',
    },
  ]
  for (const data of tenantData) {
    payload.logger.info(`Creating ${data.name} tenant returned...`)
    const tenant = await payload.create({
      collection: 'tenants',
      data: data,
      context: {
        disableRevalidate: true,
      },
    })

    if (!tenant) {
      throw new Error(`Creating ${data.name} tenant returned null...`)
    }
  }
}

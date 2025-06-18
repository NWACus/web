import { Role, User } from '@/payload-types'
import { Payload, RequiredDataFromCollectionSlug } from 'payload'

export const bootstrap = async ({
  payload,
  user,
}: {
  payload: Payload
  user: User
}): Promise<void> => {
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
    const role = await payload.create({
      collection: 'roles',
      data: data,
    })

    if (!role) {
      throw new Error(`Creating ${data.name} role returned null...`)
    }
    roles[data.name] = role
  }

  payload.logger.info(`— Seeding global role assignments...`)

  // Super admin role assignment
  await payload.create({
    collection: 'globalRoleAssignments',
    data: {
      roles: [roles['Admin']],
      user: user,
    },
  })

  payload.logger.info(`— Seeding tenants...`)

  const tenantData: RequiredDataFromCollectionSlug<'tenants'>[] = [
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
    })

    if (!tenant) {
      throw new Error(`Creating ${data.name} tenant returned null...`)
    }
  }
}

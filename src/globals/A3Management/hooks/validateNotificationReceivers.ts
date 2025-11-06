import { hasGlobalRolePermission } from '@/utilities/rbac/hasGlobalOrTenantRolePermission'
import type { GlobalBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'

export const validateNotificationReceivers: GlobalBeforeValidateHook = async ({ data, req }) => {
  if (!data || !data.notificationReceivers || data.notificationReceivers.length === 0) {
    return data
  }

  const notificationReceivers = data.notificationReceivers

  // Check each notification receiver to ensure they have provider permissions
  for (const receiver of notificationReceivers) {
    if (typeof receiver === 'number') {
      // Fetch user from the database
      const user = await req.payload.findByID({
        collection: 'users',
        id: receiver,
        depth: 2, // Need depth to get populated globalRoleAssignments and roleAssignments
      })

      // Check if user has provider permissions (either * or specific provider actions)
      const hasProviderPermission = hasGlobalRolePermission({
        method: '*',
        collection: 'providers',
        user,
      })

      if (!hasProviderPermission) {
        throw new ValidationError({
          errors: [
            {
              message: `User "${user.email}" does not have the required provider permissions to receive notifications. Only users with provider management permissions can be added as notification receivers.`,
              path: 'notificationReceivers',
            },
          ],
        })
      }
    } else if (typeof receiver === 'object' && receiver && 'email' in receiver) {
      // User is already populated, check permissions directly
      const hasProviderPermission = hasGlobalRolePermission({
        method: '*',
        collection: 'providers',
        user: receiver,
      })

      if (!hasProviderPermission) {
        throw new ValidationError({
          errors: [
            {
              message: `User "${receiver.email}" does not have the required provider permissions to receive notifications. Only users with provider management permissions can be added as notification receivers.`,
              path: 'notificationReceivers',
            },
          ],
        })
      }
    }
  }

  return data
}

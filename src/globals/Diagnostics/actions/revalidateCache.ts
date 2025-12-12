'use server'

import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getPayload, PayloadRequest } from 'payload'

type RevalidateResult = {
  success: boolean
  message?: string
  error?: string
}

export async function revalidateCacheAction(): Promise<RevalidateResult> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user has super admin permissions
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockedReq = { user, payload } as PayloadRequest
    const isSuperAdmin = await hasSuperAdminPermissions({ req: mockedReq })

    if (!isSuperAdmin) {
      return { success: false, error: 'Super admin access required' }
    }

    revalidatePath('/', 'layout')
    payload.logger.info(`Cache revalidation triggered for entire application by user ${user.id}`)

    return {
      success: true,
      message: 'Entire application cache has been revalidated',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revalidate cache',
    }
  }
}

import type { NextResponse } from 'next/server'

import { productDisabledResponse, unknownCenterResponse } from './apiResponses'
import { getNativeProductFlag, type NativeProduct } from './getNativeProductFlag'
import { isValidTenantSlug } from './tenancy/avalancheCenters'

/**
 * The checks a native product's `/api/[center]/…` route opens with: the center is a known tenant,
 * and has the product's rollout flag on. Answers the reply to send when either fails — before any
 * upstream read — or null to carry on.
 */
export async function nativeProductGate(
  center: string,
  product: NativeProduct,
): Promise<NextResponse | null> {
  if (!isValidTenantSlug(center)) return unknownCenterResponse()
  if (!(await getNativeProductFlag(center, product))) return productDisabledResponse()
  return null
}

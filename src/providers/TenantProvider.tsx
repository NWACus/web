'use client'

import { Tenant } from '@/payload-types'
import { createContext, use } from 'react'

export type TenantContextType = {
  tenant: Tenant | null
}

const initialContext: TenantContextType = {
  tenant: null,
}

const TenantContext = createContext(initialContext)

export const TenantProvider = ({
  tenant,
  children,
}: {
  tenant: Tenant
  children: React.ReactNode
}) => {
  return <TenantContext value={{ tenant }}>{children}</TenantContext>
}

export const useTenant = (): TenantContextType => use(TenantContext)

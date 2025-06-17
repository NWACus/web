'use client'

import { Tenant } from '@/payload-types'
import { createContext, use } from 'react'

export type TenantContextType = {
  tenant: Tenant | null
  hostname: string | null
}

const initialContext: TenantContextType = {
  tenant: null,
  hostname: null, // TODO: maybe default to the root domain
}

const TenantContext = createContext(initialContext)

export const TenantProvider = ({
  tenant,
  hostname,
  children,
}: {
  tenant: Tenant
  hostname: string
  children: React.ReactNode
}) => {
  return <TenantContext value={{ tenant, hostname }}>{children}</TenantContext>
}

export const useTenant = (): TenantContextType => use(TenantContext)

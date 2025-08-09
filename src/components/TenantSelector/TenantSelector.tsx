import { isTenantDomainScoped } from '@/utilities/tenancy/isTenantDomainScoped'
import { type AdminViewServerProps } from 'payload'
import TenantSelectorClient from './TenantSelector.client'

const TenantSelector = async ({ params }: AdminViewServerProps) => {
  const isGlobalDocument =
    params?.segments?.includes('settings') || params?.segments?.includes('navigations')
  const hideTenantSelect =
    params?.segments?.includes('roles') ||
    params?.segments?.includes('globalRoles') ||
    params?.segments?.includes('globals')
  const { isDomainScoped } = await isTenantDomainScoped()

  if (isDomainScoped) {
    return null
  }

  return (
    <TenantSelectorClient
      label="Avalanche Center"
      isGlobalDocument={isGlobalDocument}
      hideTenantSelect={hideTenantSelect}
    />
  )
}

export default TenantSelector

import { isTenantDomainScoped } from '@/utilities/tenancy/isTenantDomainScoped'
import TenantSelectorClient from './TenantSelector.client'

const TenantSelector = async () => {
  const { isDomainScoped } = await isTenantDomainScoped()

  if (isDomainScoped) {
    return null
  }

  return <TenantSelectorClient label="Avalanche Center" />
}

export default TenantSelector

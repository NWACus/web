import { byGlobalRole } from '@/access/byGlobalRole'
import { DuplicatePageForDrawer } from './DuplicatePageForDrawer'

export const DuplicatePageFor = () => {
  const isSuperAdmin = byGlobalRole('*', '*')
  if (!isSuperAdmin) return null
  return <DuplicatePageForDrawer />
}

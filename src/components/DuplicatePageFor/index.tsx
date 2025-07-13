import { EditMenuItemsServerProps } from 'payload'
import { DuplicatePageForDrawer } from './DuplicatePageForDrawer'

export const DuplicatePageFor = ({ user }: EditMenuItemsServerProps) => {
  const isSuperAdmin = (user?.globalRoles?.docs?.length ?? 0) > 0
  if (!isSuperAdmin) return null
  return <DuplicatePageForDrawer />
}

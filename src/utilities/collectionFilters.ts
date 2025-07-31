import { FilterOptionsProps } from 'payload'

export const getImageTypeFilter = () => ({
  mimeType: { contains: 'image' },
})

export const getTenantFilter = ({ data }: FilterOptionsProps) => ({
  tenant: {
    equals: data.tenant,
  },
})

export const getTenantAndIdFilter = ({ id, data }: FilterOptionsProps) => ({
  id: {
    not_in: [id],
  },
  tenant: {
    equals: data.tenant,
  },
})

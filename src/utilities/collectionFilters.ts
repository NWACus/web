import { FilterOptionsProps } from 'payload'

export const getImageTypeFilter = () => ({
  mimeType: { contains: 'image' },
})

export const getTenantFilter = ({
  data,
  siblingData,
  blockData,
  relationTo,
}: FilterOptionsProps) => {
  console.log('data in getTenantFilter: ', JSON.stringify(data))

  return {
    tenant: {
      equals: data.tenant,
    },
  }
}

export const getTenantAndIdFilter = ({ id, data }: FilterOptionsProps) => ({
  id: {
    not_in: [id],
  },
  tenant: {
    equals: data.tenant,
  },
})

import { filterByTenant } from '@/access/filterByTenant'
import { tenantField } from '@/fields/tenantField'
import { BaseListFilter, Config, Where } from 'payload'

type Args = {
  baseListFilter?: BaseListFilter
  customFilter: BaseListFilter
}
/**
 * Combines a base list filter with a tenant list filter
 *
 * Combines where constraints inside of an AND operator
 */
export const combineListFilters =
  ({ baseListFilter, customFilter }: Args): BaseListFilter =>
  async (args) => {
    const filterConstraints: Where[] = []

    if (typeof baseListFilter === 'function') {
      const baseListFilterResult = await baseListFilter(args)

      if (baseListFilterResult) {
        filterConstraints.push(baseListFilterResult)
      }
    }

    const customFilterResult = await customFilter(args)

    if (customFilterResult) {
      filterConstraints.push(customFilterResult)
    }

    if (filterConstraints.length) {
      const combinedWhere: Where = { and: [] }
      filterConstraints.forEach((constraint) => {
        if (combinedWhere.and && constraint && typeof constraint === 'object') {
          combinedWhere.and.push(constraint)
        }
      })
      return combinedWhere
    }

    // Access control will take it from here
    return null
  }

type CollectionOptions = {
  slug: string
  addField?: boolean
  addFilter?: boolean
  fieldOverrides?: Record<string, any>
}

type TenantFieldPluginOptions = {
  collections: CollectionOptions[]
  defaultFieldOverrides?: Record<string, any>
}

const tenantFieldPlugin = (options: TenantFieldPluginOptions) => {
  return (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    if (!config.collections) {
      config.collections = []
    }

    config.collections = config.collections.map((collection) => {
      const collectionOptions = options.collections.find((opt) => opt.slug === collection.slug)

      if (collectionOptions) {
        let updatedCollection = { ...collection }

        if (collectionOptions.addFilter !== false) {
          if (!updatedCollection.admin) {
            updatedCollection.admin = {}
          }

          updatedCollection.admin.baseListFilter = combineListFilters({
            baseListFilter: updatedCollection.admin?.baseListFilter,
            customFilter: filterByTenant,
          })
        }

        if (collectionOptions.addField !== false) {
          updatedCollection = {
            ...updatedCollection,
            fields: [
              ...(updatedCollection.fields || []),
              {
                ...tenantField(),
                ...(options.defaultFieldOverrides || {}),
                ...(collectionOptions.fieldOverrides || {}),
              },
            ],
          }
        }

        return updatedCollection
      }

      return collection
    })

    return config
  }
}

export default tenantFieldPlugin

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

type TenantFieldPluginOptions = {
  collections: string[]
  fieldOverrides?: Record<string, any>
}

const tenantFieldPlugin = (options: TenantFieldPluginOptions) => {
  return (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    if (!config.collections) {
      config.collections = []
    }

    config.collections = config.collections.map((collection) => {
      if (options.collections.includes(collection.slug)) {
        if (!collection.admin) {
          collection.admin = {}
        }

        collection.admin.baseListFilter = combineListFilters({
          baseListFilter: collection.admin?.baseListFilter,
          customFilter: filterByTenant,
        })

        return {
          ...collection,
          fields: [
            ...(collection.fields || []),
            {
              ...tenantField(),
              ...(options.fieldOverrides || {}),
            },
          ],
        }
      }

      return collection
    })

    return config
  }
}

export default tenantFieldPlugin

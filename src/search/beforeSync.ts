import { BeforeSync, DocToSync } from '@payloadcms/plugin-search/types'

export const beforeSyncWithSearch: BeforeSync = async ({ originalDoc, searchDoc }) => {
  const {
    doc: { relationTo: collection },
  } = searchDoc

  const { slug, id, categories, title, meta, tenant } = originalDoc

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug,
    meta: {
      ...meta,
      title: meta?.title || title,
      image: meta?.image?.id || meta?.image,
      description: meta?.description,
    },
    tenant: tenant.id,
    categories: [],
  }

  if (categories && Array.isArray(categories) && categories.length > 0) {
    // get full categories and keep a flattened copy of their most important properties
    try {
      modifiedDoc.categories = categories.map((category) => {
        const { id, title } = category

        return {
          relationTo: 'categories',
          id,
          title,
        }
      })
    } catch (err) {
      console.error(
        `Failed. Category not found when syncing collection '${collection}' with id: '${id}' to search: ${err}`,
      )
    }
  }

  return modifiedDoc
}

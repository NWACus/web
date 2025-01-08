import { Role } from '@/payload-types'
import { CollectionSlug } from 'payload'

export type ruleMethod = 'create' | 'read' | 'update' | 'delete' | '*'
export type ruleCollection = CollectionSlug | '*'

export const ruleMatches = (
  method: ruleMethod,
  theCollection: ruleCollection,
): ((rule: Role['rules'][0]) => boolean) => {
  return (rule: Role['rules'][0]): boolean => {
    const methodMatches =
      method === '*' || rule.actions.some((action) => action === '*' || action === method)
    const collectionMatches =
      theCollection === '*' ||
      rule.collections.some((collection) => collection === '*' || collection === theCollection)
    return methodMatches && collectionMatches
  }
}

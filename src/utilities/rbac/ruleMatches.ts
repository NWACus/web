import { Role } from '@/payload-types'

export const ruleMatches = (
  method: string,
  theCollection: string,
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

import * as contentful from 'contentful'
import type { TypeLogoSkeleton } from '~~/types/generated/contentful'

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig()
  // workaround for https://github.com/contentful/contentful.js/issues/1233
  const createClient = contentful.createClient
    ? contentful.createClient
    : contentful.default.createClient

  const client = createClient({
    space: config.contentful.spaceId,
    accessToken: config.contentful.apiAccessToken
  })

  const params = {
    content_type: 'logo'
  }
  if (query.avalanche_center) {
    params['metadata.tags.sys.id[all]'] = [query.avalanche_center.toLowerCase()]
  }

  const logos = await client.getEntries<TypeLogoSkeleton>(params)

  return logos
})

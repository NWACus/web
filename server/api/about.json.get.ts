import * as contentful from 'contentful'
import type {TypeGroupOrderSkeleton} from '~~/types/generated/contentful';

export default eventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  if (!query.avalanche_center) {
    throw createError({
      statusCode: 400,
      statusMessage: 'The avalanche_center parameter is required.'
    })
  } else {
    if (typeof query.avalanche_center !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'The avalanche_center parameter must be a string.'
      })
    }
    if (!config.supportedCenters.includes(query.avalanche_center)) {
      throw createError({
        statusCode: 400,
        statusMessage: `The avalanche_center parameter must be one of ${config.supportedCenters}.`
      })
    }
  }

  // workaround for https://github.com/contentful/contentful.js/issues/1233
  const createClient = contentful.createClient
    ? contentful.createClient
    : contentful.default.createClient

  const client = createClient({
    space: config.contentful.spaceId,
    accessToken: config.contentful.apiAccessToken
  })

  const groups = await client.getEntries<TypeGroupOrderSkeleton>({
    'content_type': 'groupOrder',
    'metadata.tags.sys.id[all]': [query.avalanche_center.toLowerCase()],
    'include': '5'
  })

  return groups
})

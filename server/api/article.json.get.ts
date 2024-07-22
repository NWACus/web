import * as contentful from 'contentful'
import type { TypeArticleSkeleton } from '~~/types/generated/contentful'

export default eventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  if (!query.slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'The slug parameter is required.'
    })
  } else {
    if (typeof query.slug !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'The slug parameter must be a string.'
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

  const entries = await client.getEntries<TypeArticleSkeleton>({
    'content_type': 'simpleArticle',
    'fields.slug': [query.slug],
    'include': '5'
  })

  return entries
})

import { getCachedGlobal } from './getGlobals'

export async function getNACWidgetsConfig() {
  const nacWidgetsConfig = await getCachedGlobal('nacWidgetsConfig', 1)()

  const version = nacWidgetsConfig?.version || '20250313'
  const baseUrl = nacWidgetsConfig?.baseUrl || 'https://du6amfiq9m9h7.cloudfront.net/public/v2'

  return { version, baseUrl }
}

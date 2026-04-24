import invariant from 'tiny-invariant'
import { getEnvironmentFriendlyName } from './getEnvironmentFriendlyName'
import { getCachedGlobal } from './getGlobals'

export async function getNACWidgetsConfig() {
  const nacWidgetsConfig = await getCachedGlobal('nacWidgetsConfig', 1)()

  const version = nacWidgetsConfig?.version
  invariant(
    version,
    'Could not determine NAC widgets version. Ensure this is set in the NAC Widgets Config global.',
  )

  const baseUrl = nacWidgetsConfig?.baseUrl
  invariant(
    baseUrl,
    'Could not determine NAC widgets base url. Ensure this is set in the NAC Widgets Config global.',
  )

  // In production, always force devMode off. Otherwise, respect the admin panel setting.
  const devMode =
    getEnvironmentFriendlyName() === 'prod' || !nacWidgetsConfig?.devMode
      ? false
      : nacWidgetsConfig?.devMode

  return { version, baseUrl, devMode }
}

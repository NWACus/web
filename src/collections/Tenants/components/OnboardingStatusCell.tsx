import { Pill } from '@payloadcms/ui'
import type { DefaultServerCellComponentProps } from 'payload'

import { checkProvisioningStatusAction } from './onboardingActions'

export async function OnboardingStatusCell({
  rowData,
}: Pick<DefaultServerCellComponentProps, 'rowData'>) {
  if (!rowData?.id) {
    return null
  }

  const result = await checkProvisioningStatusAction(rowData.id)

  if ('error' in result) {
    return null
  }

  const { forecastPages, defaultBuiltInPages, pages, homePage, navigation, settings } =
    result.status

  const allComplete =
    forecastPages.count >= forecastPages.expected &&
    defaultBuiltInPages.count >= defaultBuiltInPages.expected &&
    pages.created >= pages.expected &&
    pages.expected > 0 &&
    homePage &&
    navigation &&
    settings.exists &&
    result.status.theme.brandColors &&
    result.status.theme.ogColors

  return allComplete ? (
    <Pill size="small">Complete</Pill>
  ) : (
    <Pill size="small" pillStyle="warning">
      Incomplete
    </Pill>
  )
}

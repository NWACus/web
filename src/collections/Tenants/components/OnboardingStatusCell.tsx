import { Pill } from '@payloadcms/ui'
import type { DefaultServerCellComponentProps } from 'payload'

import { checkProvisioningStatusAction } from './onboardingActions'

export async function OnboardingStatusCell({ rowData }: DefaultServerCellComponentProps) {
  if (!rowData?.id) {
    return null
  }

  const result = await checkProvisioningStatusAction(rowData.id)

  if ('error' in result) {
    return null
  }

  const { builtInPages, pages, homePage, navigation, settings } = result.status

  const allComplete =
    builtInPages.count >= builtInPages.expected &&
    pages.copied >= pages.expected &&
    pages.expected > 0 &&
    homePage &&
    navigation &&
    settings.exists

  return allComplete ? (
    <Pill size="small">Complete</Pill>
  ) : (
    <Pill size="small" pillStyle="warning">
      Incomplete
    </Pill>
  )
}

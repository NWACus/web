import { getURL } from '@/utilities/getURL'
import { FieldDescription, FieldLabel } from '@payloadcms/ui'
import { pick } from 'lodash-es'
import { UIFieldServerProps } from 'payload'
import { ThemedCodeDisplay } from './ThemedCodeEditor.client'

const configKeysToDisplay = ['cors', 'csrf', 'loggingLevels', 'serverURL']

export function DiagnosticsDisplay({ req, payload }: UIFieldServerProps) {
  const configSubset = pick(payload.config, configKeysToDisplay)
  const configSubsetStr = JSON.stringify(configSubset, null, 2)

  const currentHost = req?.headers.get('host') || req?.host
  const serverURL = getURL(currentHost)

  return (
    <div className="py-8 flex flex-col gap-8">
      <div className="flex flex-col">
        <FieldLabel label="Payload Config Subset" />
        <FieldDescription
          description="A few relevant values from the Payload config in this environment."
          path=""
          className="mb-2"
        />
        <ThemedCodeDisplay value={configSubsetStr} />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel label="Result of getURL(req?.headers.get('host') || req?.host)" />
        <ThemedCodeDisplay value={serverURL} />
      </div>
    </div>
  )
}

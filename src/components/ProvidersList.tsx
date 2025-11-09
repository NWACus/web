'use client'

import type { Provider } from '@/payload-types'

import { getStateLabel } from '@/fields/location/states'
import { ProviderPreview } from './ProviderPreview'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'

type ProvidersByState = {
  [state: string]: Provider[]
}

export const ProvidersList = (props: { providersByState: ProvidersByState }) => {
  const { providersByState } = props

  // Get sorted list of states that have providers
  const statesWithProviders = Object.keys(providersByState).sort()

  if (statesWithProviders.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No course providers found.</div>
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {statesWithProviders.map((stateCode) => {
        const providers = providersByState[stateCode]
        const stateLabel = getStateLabel(stateCode)

        return (
          <AccordionItem key={stateCode} value={stateCode}>
            <AccordionTrigger className="text-base font-semibold">{stateLabel}</AccordionTrigger>
            <AccordionContent>
              <div className="divide-y">
                {providers.map((provider) => (
                  <ProviderPreview key={provider.id} doc={provider} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

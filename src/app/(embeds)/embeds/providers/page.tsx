import { CustomEmbedStyles } from '@/components/CustomEmbedStyles'
import { ProviderPreview } from '@/components/ProviderPreview'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { getStateLabel } from '@/fields/location/states'
import type { Provider } from '@/payload-types'
import config from '@/payload.config'
import { cn } from '@/utilities/ui'
import Script from 'next/script'
import { createLoader, parseAsString, SearchParams } from 'nuqs/server'
import { getPayload } from 'payload'

const providersSearchParams = {
  backgroundColor: parseAsString,
  textColor: parseAsString,
  title: parseAsString,
}

const loadSearchParams = createLoader(providersSearchParams)

type ProvidersByState = { [state: string]: Provider[] }

export default async function ProvidersEmbedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { backgroundColor, textColor, title } = await loadSearchParams(searchParams)
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'providers',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 1000,
    depth: 0,
  })

  const providers = result.docs

  // Organize providers by state based on statesServiced
  // providers can be in multiple states
  const providersByState: ProvidersByState = {}

  providers.forEach((provider) => {
    if (provider.statesServiced && provider.statesServiced.length > 0) {
      provider.statesServiced.forEach((state) => {
        if (!providersByState[state]) {
          providersByState[state] = []
        }
        providersByState[state].push(provider)
      })
    }
  })

  const states = Object.keys(providersByState).sort()

  // Split states into two columns for vertical flow
  const midpoint = Math.ceil(states.length / 2)
  const leftColumnStates = states.slice(0, midpoint)
  const rightColumnStates = states.slice(midpoint)

  const containerStyle = {
    ...(backgroundColor ? { backgroundColor } : {}),
    ...(textColor ? { color: textColor } : {}),
  }

  return (
    <>
      <CustomEmbedStyles backgroundColor={backgroundColor} textColor={textColor} />
      <div style={containerStyle} className="py-4">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-x-4">
          <StatesAccordion
            states={leftColumnStates}
            providersByState={providersByState}
            customTextColor={!!textColor}
          />
          <StatesAccordion
            states={rightColumnStates}
            providersByState={providersByState}
            customTextColor={!!textColor}
          />
        </div>
      </div>
      <Script
        type="module"
        src="https://cdn.jsdelivr.net/npm/@open-iframe-resizer/core@latest/dist/index.js"
      />
    </>
  )
}

function StatesAccordion({
  states,
  providersByState,
  customTextColor,
}: {
  states: string[]
  providersByState: ProvidersByState
  customTextColor?: boolean
}) {
  return (
    <Accordion type="multiple">
      {states.map((stateCode) => {
        const providers = providersByState[stateCode]
        const stateLabel = getStateLabel(stateCode)

        return (
          <AccordionItem key={stateCode} value={stateCode} className="border-none">
            <AccordionTrigger
              className="text-base uppercase font-semibold justify-start gap-2.5 [&[data-state=open]>svg]:rotate-45 py-1 hover:no-underline tracking-wider"
              icon="plus"
              iconPosition="left"
              chevronClassName={cn(customTextColor ? 'text-current' : 'text-foreground')}
            >
              {stateLabel}
            </AccordionTrigger>
            <AccordionContent className="pl-7 flex flex-col gap-1 pt-1.5">
              {providers.map((provider) => (
                <ProviderPreview key={provider.id} doc={provider} />
              ))}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

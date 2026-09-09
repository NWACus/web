import { A3Banner } from '@/components/A3Banner'
import { ProviderPreview } from '@/components/ProviderPreview'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { getStateLabel } from '@/fields/location/states'
import config from '@/payload.config'
import { groupProvidersByState, type ProvidersByState } from '@/utilities/groupProvidersByState'
import Script from 'next/script'
import { createLoader, parseAsString, SearchParams } from 'nuqs/server'
import { getPayload } from 'payload'

const providersSearchParams = {
  title: parseAsString,
  states: parseAsString,
}

const loadSearchParams = createLoader(providersSearchParams)

export default async function ProvidersEmbedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { title, states: statesFilter } = await loadSearchParams(searchParams)
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

  // Organize providers by state based on statesServiced (providers can be in
  // multiple states) and restrict to the selected states when a filter is given
  const { states, providersByState } = groupProvidersByState(result.docs, statesFilter)

  return (
    <>
      <div className="py-4">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
          </div>
        )}
        <A3Banner />
        <ProvidersByStateSection
          states={states}
          providersByState={providersByState}
          hasStatesFilter={Boolean(statesFilter)}
        />
      </div>
      <Script
        type="module"
        src="https://cdn.jsdelivr.net/npm/@open-iframe-resizer/core@latest/dist/index.js"
      />
    </>
  )
}

function ProvidersByStateSection({
  states,
  providersByState,
  hasStatesFilter,
}: {
  states: string[]
  providersByState: ProvidersByState
  hasStatesFilter: boolean
}) {
  if (states.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {hasStatesFilter ? 'No providers found for the selected states.' : 'No providers found.'}
        </p>
      </div>
    )
  }

  // Split states into two columns for vertical flow
  const midpoint = Math.ceil(states.length / 2)

  return (
    <div className="grid sm:grid-cols-2 gap-x-4">
      <StatesAccordion
        states={states.slice(0, midpoint)}
        providersByState={providersByState}
        defaultExpanded={hasStatesFilter}
      />
      <StatesAccordion
        states={states.slice(midpoint)}
        providersByState={providersByState}
        defaultExpanded={hasStatesFilter}
      />
    </div>
  )
}

function StatesAccordion({
  states,
  providersByState,
  defaultExpanded,
}: {
  states: string[]
  providersByState: ProvidersByState
  defaultExpanded: boolean
}) {
  return (
    <Accordion type="multiple" defaultValue={defaultExpanded ? states : undefined}>
      {states.map((stateCode) => {
        const providers = providersByState[stateCode]
        const stateLabel = getStateLabel(stateCode)

        return (
          <AccordionItem key={stateCode} value={stateCode} className="border-none">
            <AccordionTrigger
              className="text-base uppercase font-semibold justify-start gap-2.5 [&[data-state=open]>svg]:rotate-45 py-1 hover:no-underline tracking-wider"
              icon="plus"
              iconPosition="left"
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

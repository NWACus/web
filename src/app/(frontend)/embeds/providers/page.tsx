import { ProvidersList } from '@/components/ProvidersList'
import type { Provider } from '@/payload-types'
import config from '@/payload.config'
import { getPayload } from 'payload'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Props = {
  searchParams: SearchParams
}

export default async function ProvidersEmbedPage({ searchParams }: Props) {
  const params = await searchParams

  // Extract parameters
  const backgroundColor = params.backgroundColor as string
  const title = (params.title as string) || 'Avalanche Course Providers'

  // Fetch all published providers
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'providers',
    where: {
      _status: {
        equals: 'published',
      },
    },
    limit: 1000, // Fetch all providers
    sort: 'name',
    depth: 0,
  })

  const providers = result.docs as Provider[]

  // Organize providers by state based on statesServiced
  const providersByState: { [state: string]: Provider[] } = {}

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

  return (
    <div className="min-h-screen p-6" style={backgroundColor ? { backgroundColor } : undefined}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {providers.length} provider{providers.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <ProvidersList providersByState={providersByState} />
      </div>
    </div>
  )
}

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ProvidersSearch } from './ProvidersSearch'

export default async function ProviderPage() {
  const payload = await getPayload({ config: configPromise })

  const providersRes = await payload.find({
    collection: 'providers',
    limit: 1000,
    pagination: false,
    where: {
      _status: {
        equals: 'published',
      },
    },
  })
  const providers = providersRes.docs
  const providersWithApprovedCourseTypes = providers.filter(
    ({ courseTypes }) => courseTypes && courseTypes.length > 0,
  )

  return (
    <div className="pt-4">
      <div className="container mb-16">
        {/* Hero Section */}
        <div className="mb-10 space-y-4">
          <h1 className="text-4xl font-bold">Avalanche Course Providers</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Access American Avalanche Association-endorsed course providers of Recreational and
            Professional training by state.
          </p>
        </div>

        {/* Search and Filters */}
        <ProvidersSearch initialProviders={providersWithApprovedCourseTypes} />
      </div>
    </div>
  )
}

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export default async function ProviderLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{
    token: string
  }>
}) {
  const { token } = await params
  const payload = await getPayload({ config: configPromise })

  const providersRes = await payload.find({
    collection: 'providers',
    limit: 1,
    select: {
      name: true,
    },
    where: {
      token: {
        equals: token,
      },
    },
    pagination: false,
  })
  const provider = providersRes.docs[0]

  if (!provider) {
    return (
      <div className="container py-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <div className="text-8xl font-bold text-primary mb-4">404</div>
            <h1 className="text-4xl font-bold mb-4">Provider not found</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="border-b shadow">
        <div className="container">
          <h1 className="font-bold text-3xl mb-6">{provider.name}</h1>
        </div>
      </div>
      <div className="container">{children}</div>
    </div>
  )
}

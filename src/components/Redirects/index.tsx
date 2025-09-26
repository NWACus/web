import { getCachedRedirects } from '@/utilities/getRedirects'
import { handleReferenceURL } from '@/utilities/handleReferenceURL'
import { notFound, redirect } from 'next/navigation'
import invariant from 'tiny-invariant'

interface Props {
  disableNotFound?: boolean
  center: string
  url: string
}

/* SSR based dynamic redirects based on the redirects collection */
export const Redirects = async ({ disableNotFound, center, url }: Props) => {
  const redirects = await getCachedRedirects()()

  const redirectItem = redirects.find((redirect) => {
    invariant(
      typeof redirect.tenant === 'object',
      `Depth not set correctly when querying redirects. Tenant for redirect id ${redirect.id} not an object.`,
    )
    return redirect.from === url && redirect.tenant.slug === center
  })

  if (redirectItem) {
    const redirectUrl = handleReferenceURL({
      type: redirectItem.to?.type,
      reference: redirectItem.to?.reference,
      url: redirectItem.to?.url,
    })

    if (redirectUrl) redirect(redirectUrl)
  }

  if (disableNotFound) return null

  notFound()
}

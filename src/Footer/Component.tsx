import configPromise from '@payload-config'
import Link from 'next/link'

import { Logo } from '@/components/Logo/Logo'
import { getPayload } from 'payload'

export async function Footer({ center }: { center?: string }) {
  const payload = await getPayload({ config: configPromise })
  const { docs: data } = await payload.find({
    collection: 'footer',
    depth: 10,
    where: {
      'tenant.slug': {
        equals: center,
      },
    },
  })

  const { address, email, socialMedia } = data[0]
  return (
    <footer className="mt-auto border-t border-border bg-footer text-footer-foreground">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <div>
          <h3>Stay updated!</h3>
          <p>Sign up for our newsletter</p>
        </div>
        <div>
          <Link className="flex items-center" href="/">
            <Logo center={center} />
          </Link>
        </div>
        <div>
          <div className="flex flex-col items-start gap-4 md:items-center">
            {address}
            <a href={`mailto:${email}`}>{email}</a>
            {socialMedia?.instagram}
          </div>
        </div>
      </div>
    </footer>
  )
}

import configPromise from '@payload-config'
import Link from 'next/link'

import { Logo } from '@/components/Logo/Logo'
import { ImageMedia } from '@/components/Media/ImageMedia'
import { Icons } from '@/components/ui/icons'
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

  const { address, email, logo, socialMedia } = data[0]
  return (
    <footer className="mt-auto border-t border-border bg-footer text-footer-foreground">
      <div className="container py-8 gap-8 grid grid-cols-3">
        <div>
          <h3>Stay updated!</h3>
          <p>Sign up for our newsletter</p>
        </div>
        <div>
          <Link className="flex items-center" href="/">
            {logo ? <ImageMedia resource={logo} /> : <Logo center={center} />}
          </Link>
        </div>
        <div>
          <div className="flex flex-col items-start gap-4">
            <div className="whitespace-pre-line">{address}</div>
            <a href={`mailto:${email}`}>{email}</a>
            <div className="flex gap-x-2">
              {socialMedia?.instagram && <Icons.instagram />}
              {socialMedia?.facebook && <Icons.facebook />}
              {socialMedia?.twitter && <Icons.twitter />}
              {socialMedia?.linkedin && <Icons.linkedin />}
              {socialMedia?.youtube && <Icons.youtube />}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

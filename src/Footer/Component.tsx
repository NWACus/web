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
  const { address, email, hashtag, logo, name, phone, privacy, socialMedia, terms } = data[0]
  return (
    <footer className="mt-auto border-t border-border bg-footer text-footer-foreground">
      <div className="container py-8 gap-8 grid grid-cols-3">
        <div>
          <h4 className="font-medium text-xl mb-2">Stay updated!</h4>
          <p>Sign up for our newsletter</p>
        </div>
        <div>
          <Link className="flex items-center" href="/">
            {logo ? <ImageMedia resource={logo} /> : <Logo center={center} />}
          </Link>
        </div>
        <div>
          <div className="flex flex-col items-start">
            <h4 className="font-medium text-xl mb-2">{name}</h4>
            {address && <div className="whitespace-pre-line">{address}</div>}
            {phone && <a href={`tel:${phone}`}>{phone}</a>}
            {email && (
              <a className="mb-6 text-secondary underline" href={`mailto:${email}`}>
                {email}
              </a>
            )}
            {socialMedia && (
              <div className="flex gap-x-4 mb-2">
                {socialMedia.instagram && <Icons.instagram />}
                {socialMedia.facebook && <Icons.facebook />}
                {socialMedia.twitter && <Icons.twitter />}
                {socialMedia.linkedin && <Icons.linkedin />}
                {socialMedia.youtube && <Icons.youtube />}
              </div>
            )}
            {hashtag && <p className="mb-4 text-secondary underline">{hashtag}</p>}
          </div>
        </div>
      </div>
      <div className="container text-center pb-8">
        <p className="mb-2">All Content © 2017 – 2025 {name}</p>
        <div className="flex gap-x-2 justify-center">
          {typeof terms === 'object' && (
            <a href={`/${terms?.slug}`} className="underline">
              {terms?.title}
            </a>
          )}
          {terms && privacy && <div>|</div>}
          {typeof privacy === 'object' && (
            <a href={`/${privacy?.slug}`} className="underline">
              {privacy?.title}
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}

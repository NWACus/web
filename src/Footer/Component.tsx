import configPromise from '@payload-config'
import Link from 'next/link'
import invariant from 'tiny-invariant'

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
  const { address, email, hashtag, footerLogo, name, phone, privacy, socialMedia, terms } =
    data?.[0]

  invariant(
    typeof terms === 'object',
    `Depth not set correctly when querying footer. Terms for tenant ${center} not an object.`,
  )

  invariant(
    typeof privacy === 'object',
    `Depth not set correctly when querying footer. Privacy for tenant ${center} not an object.`,
  )

  const currentYear = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-border bg-footer text-footer-foreground">
      <div className="container py-8 gap-8 grid grid-cols-3">
        <div>
          <h4 className="font-medium text-xl mb-2">Stay updated!</h4>
          <p>Sign up for our newsletter</p>
        </div>
        <div>
          <Link className="flex items-center" href="/">
            {footerLogo ? <ImageMedia resource={footerLogo} /> : <Logo center={center} />}
          </Link>
        </div>
        <div>
          <div className="flex flex-col items-start">
            <h4 className="font-medium text-xl mb-2">{name}</h4>
            {address && <div className="whitespace-pre-line">{address}</div>}
            {phone && <a href={`tel:${phone}`}>{phone}</a>}
            {email && (
              <a className="mb-4 text-secondary underline" href={`mailto:${email}`}>
                {email}
              </a>
            )}
            {socialMedia && (
              // Icon colors controlled by color class
              <div className="flex items-center gap-x-2 mb-2 text-secondary">
                {socialMedia.instagram && (
                  <a href={socialMedia.instagram} target="_blank" className="p-1">
                    <Icons.instagram />
                  </a>
                )}
                {socialMedia.facebook && (
                  <a href={socialMedia.facebook} target="_blank" className="p-1">
                    <Icons.facebook />
                  </a>
                )}
                {socialMedia.twitter && (
                  <a href={socialMedia.twitter} target="_blank" className="p-1">
                    <Icons.twitter />
                  </a>
                )}
                {socialMedia.linkedin && (
                  <a href={socialMedia.linkedin} target="_blank" className="p-1">
                    <Icons.linkedin />
                  </a>
                )}
                {socialMedia.youtube && (
                  <a href={socialMedia.youtube} target="_blank" className="p-1">
                    <Icons.youtube />
                  </a>
                )}
              </div>
            )}
            {hashtag && <p className="mb-4 text-secondary underline">{hashtag}</p>}
          </div>
        </div>
      </div>
      <div className="container text-center pb-8">
        <p className="mb-2">
          All Content © {currentYear} {name}
        </p>
        <div className="flex gap-x-2 justify-center">
          {terms && (
            <a href={`/${terms.slug}`} className="underline">
              {terms.title}
            </a>
          )}
          {terms && privacy && <div>|</div>}
          {privacy && (
            <a href={`/${privacy.slug}`} className="underline">
              {privacy.title}
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}

import type { Form, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const contact: (
  tenant: Tenant,
  contactForm: Form,
) => RequiredDataFromCollectionSlug<'pages'> = (
  tenant: Tenant,
  contactForm: Form,
): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'contact',
    tenant: tenant.id,
    _status: 'published',
    publishedAt: new Date().toISOString(),
    layout: [
      {
        blockType: 'formBlock',
        enableIntro: true,
        form: contactForm.id,
        introContent: {
          root: {
            type: 'root',
            children: [
              {
                type: 'heading',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Example contact form:',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                tag: 'h3',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
      },
    ],
    title: 'Contact',
  }
}

import { navLink } from '@/fields/navLink'
import { Tab } from 'payload'

export const singleLinkNavTab = ({
  name,
  description,
  enabledToggleDescription = 'If hidden, pages with links in this nav item will not be accessible at their navigation-nested URLs.',
}: {
  name: string
  description?: string
  enabledToggleDescription?: string
}): Tab => ({
  name,
  fields: [
    {
      type: 'group',
      name: 'options',
      label: '',
      fields: [
        {
          type: 'checkbox',
          defaultValue: true,
          name: 'enabled',
          label: 'Show Item in Navigation',
          admin: {
            description: enabledToggleDescription,
          },
        },
      ],
    },
    {
      ...navLink,
      label: '',
      admin: {
        ...navLink.admin,
        components: {
          ...navLink.admin?.components,
          ...(description
            ? {
                Description: {
                  path: '@/components/BannerDescription#BannerDescription',
                  clientProps: {
                    message: description,
                    type: 'info',
                  },
                },
              }
            : {}),
        },
      },
    },
  ],
})

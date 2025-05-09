import { RequiredDataFromCollectionSlug } from 'payload'

export const membership: RequiredDataFromCollectionSlug<'pages'>['layout'] = [
  {
    blockType: 'membership',
    richText: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Become an NWAC Member',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'heading',
            version: 1,
            tag: 'h2',
          },

          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'NWAC is a community-supported avalanche center. As an NWAC member, you directly support the forecast you use on every backcountry adventure.',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },

          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Looking for more info on how to edit, update, or cancel your recurring membership? Check out this helpful article.',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },
          {
            type: 'block',
            version: 2,
            format: '',
            fields: {
              blockName: '',
              buttons: [
                {
                  button: {
                    type: 'custom',
                    appearance: 'secondary',
                    label: 'Become a member',
                    url: '/home',
                  },
                },

                {
                  button: {
                    type: 'custom',
                    appearance: 'default',
                    label: 'Renew your membership',
                    url: '/home',
                  },
                },
              ],
              blockType: 'buttonBlock',
            },
          },
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Wanting to change your monthly or annual membership contribution to NWAC? Check out our handy infographic to make changes to your recurring NWAC membership.',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },

          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Please contact ',
                type: 'text',
                version: 1,
              },

              {
                type: 'autolink',

                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'info@nwac.us',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',

                fields: {
                  linkType: 'custom',
                  url: 'mailto:info@nwac.us',
                },
                format: '',
                indent: 0,
                version: 2,
              },

              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: ' if you have any questions. Have questions about your membership or want to upgrade to a higher-level membership? Please contact ',
                type: 'text',
                version: 1,
              },
              {
                type: 'autolink',
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'liz@nwac.us',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                fields: {
                  linkType: 'custom',
                  url: 'mailto:liz@nwac.us',
                },
                format: '',
                indent: 0,
                version: 2,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
    enableCallout: true,
    callout: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Already a member? ',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'heading',
            version: 1,
            tag: 'h3',
          },
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'NWAC is a 501-c3 Non-Profit. Our tax identification number is #91-1971688.',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },
          {
            type: 'block',
            version: 2,
            format: '',
            fields: {
              buttons: [
                {
                  button: {
                    type: 'custom',
                    appearance: 'default',
                    label: 'Make an Additional Donation',
                    url: '/home',
                  },
                },
              ],
              blockType: 'buttonBlock',
            },
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
  },
]

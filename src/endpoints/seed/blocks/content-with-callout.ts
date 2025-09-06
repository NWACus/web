import { RequiredDataFromCollectionSlug } from 'payload'

export const contentWithCallout: RequiredDataFromCollectionSlug<'pages'>['layout'] = [
  {
    backgroundColor: 'transparent',
    layout: '2_12',
    blockName: null,
    columns: [
      {
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
                    text: "I'm baby seitan poutine adaptogen try-hard microdosing edison bulb tote bag before they sold out locavore blackbird spyplane farm-to-table flannel salvia. Fashion axe YOLO bespoke, 8-bit bicycle rights heirloom af. Helvetica ennui aesthetic vexillologist yes plz. Deep v green juice gentrify XOXO unicorn same letterpress forage YOLO vegan truffaut seitan you probably haven't heard of them enamel pin. Sartorial blue bottle tacos narwhal tumblr keffiyeh, vexillologist chia subway tile iPhone woke scenester lyft plaid jawn. Unicorn dreamcatcher brunch umami scenester paleo semiotics 8-bit.",
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
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },

      {
        richText: {
          root: {
            children: [
              {
                type: 'block',
                version: 2,
                format: '',

                fields: {
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
                              text: "I'm baby seitan poutine adaptogen try-hard microdosing edison bulb tote bag before they sold out locavore blackbird spyplane farm-to-table flannel salvia. Fashion axe YOLO bespoke, 8-bit bicycle rights heirloom af. ",
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
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      type: 'root',
                      version: 1,
                    },
                  },
                  blockName: '',
                  backgroundColor: 'brand-500',
                  blockType: 'calloutBlock',
                },
              },

              {
                children: [],
                direction: null,
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
      },
    ],
    blockType: 'content',
  },
]

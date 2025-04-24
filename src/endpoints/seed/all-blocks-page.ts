import type { Media, Tenant } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const allBlocksPage: (
  tenant: Tenant,
  image1: Media,
) => RequiredDataFromCollectionSlug<'pages'> = (
  tenant: Tenant,
  image1: Media,
): RequiredDataFromCollectionSlug<'pages'> => {
  return {
    slug: 'blocks',
    tenant: tenant,
    title: 'Blocks',
    _status: 'published',
    hero: {
      type: 'lowImpact',
      richText: null,
      links: [],
      media: null,
    },
    layout: [
      // 4 column layout
      {
        layout: 'above',
        blockName: null,
        columns: [
          {
            image: image1.id,
            title: 'Some title 1',
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
                        text: 'Four loko hammock distillery, cloud bread fashion axe next level scenester. Portland meditation organic, la croix keytar waistcoat distillery vice disrupt hashtag fixie cray single-origin coffee PBR&B kitsch. Master cleanse kogi iceland four loko +1 hot chicken, hoodie intelligentsia. Four loko literally praxis banjo dreamcatcher chartreuse, pork belly scenester JOMO tote bag hexagon next level put a bird on it bruh fashion axe. Man bun kogi bespoke farm-to-table scenester fixie edison bulb. Man braid Brooklyn crucifix grailed salvia yr poutine stumptown beard. Stumptown coloring book tonx Brooklyn helvetica YOLO bitters man braid williamsburg ramps.',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
            image: image1.id,
            title: 'Some title 2',
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
                        text: "Neutral milk hotel yr yes plz leggings fam. You probably haven't heard of them ramps roof party hashtag small batch occupy freegan health goth street art cronut pop-up. Vexillologist single-origin coffee neutral milk hotel everyday carry gluten-free chartreuse intelligentsia letterpress hot chicken live-edge selfies wolf chia. Woke gochujang neutra waistcoat, wolf neutral milk hotel lumbersexual cupping salvia yr hella trust fund unicorn pour-over. Jean shorts migas 90's woke, fashion axe schlitz hoodie tattooed pickled man braid yes plz taiyaki kickstarter gentrify organic. Meditation vegan mumblecore tumblr big mood kitsch cray offal kombucha cred vice.",
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
            image: image1.id,
            title: 'Some title',
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
                        text: "Biodiesel pug small batch vibecession 90's hammock. Raw denim listicle kombucha poutine aesthetic, kale chips church-key fingerstache trust fund same irony fashion axe. Art party bodega boys enamel pin coloring book tote bag put a bird on it ennui air plant 8-bit celiac butcher humblebrag. Brooklyn jean shorts fam, bodega boys whatever four loko coloring book.",
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
                        text: 'Four loko hammock distillery, cloud bread fashion axe next level scenester. Portland meditation organic, la croix keytar waistcoat distillery vice disrupt hashtag fixie cray single-origin coffee PBR&B kitsch. Master cleanse kogi iceland four loko +1 hot chicken, hoodie intelligentsia. Four loko literally praxis banjo dreamcatcher chartreuse, pork belly scenester JOMO tote bag hexagon next level put a bird on it bruh fashion axe. Man bun kogi bespoke farm-to-table scenester fixie edison bulb. Man braid Brooklyn crucifix grailed salvia yr poutine stumptown beard. Stumptown coloring book tonx Brooklyn helvetica YOLO bitters man braid williamsburg ramps.',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
            image: image1.id,
            title: 'Some title 2',
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
                        text: "Neutral milk hotel yr yes plz leggings fam. You probably haven't heard of them ramps roof party hashtag small batch occupy freegan health goth street art cronut pop-up. Vexillologist single-origin coffee neutral milk hotel everyday carry gluten-free chartreuse intelligentsia letterpress hot chicken live-edge selfies wolf chia. Woke gochujang neutra waistcoat, wolf neutral milk hotel lumbersexual cupping salvia yr hella trust fund unicorn pour-over. Jean shorts migas 90's woke, fashion axe schlitz hoodie tattooed pickled man braid yes plz taiyaki kickstarter gentrify organic. Meditation vegan mumblecore tumblr big mood kitsch cray offal kombucha cred vice.",
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
        ],
        blockType: 'imageTextList',
      },
      // 3 column layout
      {
        layout: 'above',
        blockName: null,
        columns: [
          {
            image: image1.id,
            title: 'Some title 1',
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
                        text: 'Four loko hammock distillery, cloud bread fashion axe next level scenester. Portland meditation organic, la croix keytar waistcoat distillery vice disrupt hashtag fixie cray single-origin coffee PBR&B kitsch. Master cleanse kogi iceland four loko +1 hot chicken, hoodie intelligentsia. Four loko literally praxis banjo dreamcatcher chartreuse, pork belly scenester JOMO tote bag hexagon next level put a bird on it bruh fashion axe. Man bun kogi bespoke farm-to-table scenester fixie edison bulb. Man braid Brooklyn crucifix grailed salvia yr poutine stumptown beard. Stumptown coloring book tonx Brooklyn helvetica YOLO bitters man braid williamsburg ramps.',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
            image: image1.id,
            title: 'Some title 2',
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
                        text: "Neutral milk hotel yr yes plz leggings fam. You probably haven't heard of them ramps roof party hashtag small batch occupy freegan health goth street art cronut pop-up. Vexillologist single-origin coffee neutral milk hotel everyday carry gluten-free chartreuse intelligentsia letterpress hot chicken live-edge selfies wolf chia. Woke gochujang neutra waistcoat, wolf neutral milk hotel lumbersexual cupping salvia yr hella trust fund unicorn pour-over. Jean shorts migas 90's woke, fashion axe schlitz hoodie tattooed pickled man braid yes plz taiyaki kickstarter gentrify organic. Meditation vegan mumblecore tumblr big mood kitsch cray offal kombucha cred vice.",
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
            image: image1.id,
            title: 'Some title',
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
                        text: "Biodiesel pug small batch vibecession 90's hammock. Raw denim listicle kombucha poutine aesthetic, kale chips church-key fingerstache trust fund same irony fashion axe. Art party bodega boys enamel pin coloring book tote bag put a bird on it ennui air plant 8-bit celiac butcher humblebrag. Brooklyn jean shorts fam, bodega boys whatever four loko coloring book.",
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
                        text: 'Four loko hammock distillery, cloud bread fashion axe next level scenester. Portland meditation organic, la croix keytar waistcoat distillery vice disrupt hashtag fixie cray single-origin coffee PBR&B kitsch. Master cleanse kogi iceland four loko +1 hot chicken, hoodie intelligentsia. Four loko literally praxis banjo dreamcatcher chartreuse, pork belly scenester JOMO tote bag hexagon next level put a bird on it bruh fashion axe. Man bun kogi bespoke farm-to-table scenester fixie edison bulb. Man braid Brooklyn crucifix grailed salvia yr poutine stumptown beard. Stumptown coloring book tonx Brooklyn helvetica YOLO bitters man braid williamsburg ramps.',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
        ],
        blockType: 'imageTextList',
      },
      // 2 column layout
      {
        layout: 'above',
        blockName: null,
        columns: [
          {
            image: image1.id,
            title: 'Some title 1',
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
                        text: 'Four loko hammock distillery, cloud bread fashion axe next level scenester. Portland meditation organic, la croix keytar waistcoat distillery vice disrupt hashtag fixie cray single-origin coffee PBR&B kitsch. Master cleanse kogi iceland four loko +1 hot chicken, hoodie intelligentsia. Four loko literally praxis banjo dreamcatcher chartreuse, pork belly scenester JOMO tote bag hexagon next level put a bird on it bruh fashion axe. Man bun kogi bespoke farm-to-table scenester fixie edison bulb. Man braid Brooklyn crucifix grailed salvia yr poutine stumptown beard. Stumptown coloring book tonx Brooklyn helvetica YOLO bitters man braid williamsburg ramps.',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
            image: image1.id,
            title: 'Some title 2',
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
                        text: "Neutral milk hotel yr yes plz leggings fam. You probably haven't heard of them ramps roof party hashtag small batch occupy freegan health goth street art cronut pop-up. Vexillologist single-origin coffee neutral milk hotel everyday carry gluten-free chartreuse intelligentsia letterpress hot chicken live-edge selfies wolf chia. Woke gochujang neutra waistcoat, wolf neutral milk hotel lumbersexual cupping salvia yr hella trust fund unicorn pour-over. Jean shorts migas 90's woke, fashion axe schlitz hoodie tattooed pickled man braid yes plz taiyaki kickstarter gentrify organic. Meditation vegan mumblecore tumblr big mood kitsch cray offal kombucha cred vice.",
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
        ],
        blockType: 'imageTextList',
      },
      // Full bleed column layout
      {
        layout: 'above',
        blockName: null,
        columns: [
          {
            image: image1.id,
            title: 'Some title 1',
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
                        text: 'Four loko hammock distillery, cloud bread fashion axe next level scenester. Portland meditation organic, la croix keytar waistcoat distillery vice disrupt hashtag fixie cray single-origin coffee PBR&B kitsch. Master cleanse kogi iceland four loko +1 hot chicken, hoodie intelligentsia. Four loko literally praxis banjo dreamcatcher chartreuse, pork belly scenester JOMO tote bag hexagon next level put a bird on it bruh fashion axe. Man bun kogi bespoke farm-to-table scenester fixie edison bulb. Man braid Brooklyn crucifix grailed salvia yr poutine stumptown beard. Stumptown coloring book tonx Brooklyn helvetica YOLO bitters man braid williamsburg ramps.',
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
            image: image1.id,
            title: 'Some title 2',
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
                        text: "Neutral milk hotel yr yes plz leggings fam. You probably haven't heard of them ramps roof party hashtag small batch occupy freegan health goth street art cronut pop-up. Vexillologist single-origin coffee neutral milk hotel everyday carry gluten-free chartreuse intelligentsia letterpress hot chicken live-edge selfies wolf chia. Woke gochujang neutra waistcoat, wolf neutral milk hotel lumbersexual cupping salvia yr hella trust fund unicorn pour-over. Jean shorts migas 90's woke, fashion axe schlitz hoodie tattooed pickled man braid yes plz taiyaki kickstarter gentrify organic. Meditation vegan mumblecore tumblr big mood kitsch cray offal kombucha cred vice.",
                        type: 'text',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: 'start',
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
        ],
        blockType: 'imageTextList',
      },
    ],
    meta: {
      title: null,
      image: null,
      description: null,
    },
  }
}

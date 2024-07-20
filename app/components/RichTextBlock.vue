<script setup lang="ts">
import type { Node, Block } from '@contentful/rich-text-types'
import { Text, INLINES, BLOCKS } from '@contentful/rich-text-types'
import {
  ProseH1,
  ProseH2,
  ProseH3,
  ProseH4,
  ProseH5,
  ProseH6,
  ProseP,
  UPage,
  ProseOl,
  ProseUl,
  ProseLi,
  ProseHr,
  ProseBlockquote,
  ProseTable,
  ProseTr,
  ProseTbody,
  ProseTh,
  UPageBody
} from '#components'

const props = defineProps<{
  block: Block
}>()

if (!props.block) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const headingKebabCase = (heading: string) => encodeURIComponent(heading.toLowerCase().replaceAll(/\s+/g, '-'))

const headerValue = computed(
  () => {
    if (props.block.content.length > 0 && props.block.content[0]?.nodeType == 'text') {
      return headingKebabCase(props.block.content[0].value)
    }
    return ''
  }
)

const blockType = computed(
  () => {
    return {
      [BLOCKS.DOCUMENT]: { component: UPageBody, props: {} },
      [BLOCKS.PARAGRAPH]: { component: ProseP, props: {} },
      [BLOCKS.HEADING_1]: { component: ProseH1, props: { id: headerValue.value } },
      [BLOCKS.HEADING_2]: { component: ProseH2, props: { id: headerValue.value } },
      [BLOCKS.HEADING_3]: { component: ProseH3, props: { id: headerValue.value } },
      [BLOCKS.HEADING_4]: { component: ProseH4, props: { id: headerValue.value } },
      [BLOCKS.HEADING_5]: { component: ProseH5, props: { id: headerValue.value } },
      [BLOCKS.HEADING_6]: { component: ProseH6, props: { id: headerValue.value } },
      [BLOCKS.OL_LIST]: { component: ProseOl, props: {} },
      [BLOCKS.UL_LIST]: { component: ProseUl, props: {} },
      [BLOCKS.LIST_ITEM]: { component: ProseLi, props: {} },
      [BLOCKS.HR]: { component: ProseHr, props: {} },
      [BLOCKS.QUOTE]: { component: ProseBlockquote, props: {} },
      [BLOCKS.EMBEDDED_ENTRY]: { component: '', props: {} },
      [BLOCKS.EMBEDDED_ASSET]: { component: '', props: {} }, // TODO: use NuxtImage
      [BLOCKS.EMBEDDED_RESOURCE]: { component: '', props: {} },
      [BLOCKS.TABLE]: { component: ProseTable, props: {} },
      [BLOCKS.TABLE_ROW]: { component: ProseTr, props: {} },
      [BLOCKS.TABLE_CELL]: { component: ProseTbody, props: {} },
      [BLOCKS.TABLE_HEADER_CELL]: { component: ProseTh, props: {} }
    }[props.block.nodeType]
  }
)

const isInline = (node: Node) => Object.keys(INLINES).includes(node.nodeType)
const isBlock = (node: Node) => Object.keys(BLOCKS).includes(node.nodeType)
const isText = (node: Node) => node.nodeType === 'text'
</script>

<template>
  <component
    :is="blockType.component"
    v-bind="blockType.props"
  >
    <template
      v-for="child in props.block.content"
    >
      <RichTextBlock
        v-if="isBlock(child)"
        :block="child"
      />
      <RichTextInline
        v-if="isInline(child)"
        :block="child"
      />
      <RichTextText
        v-if="isText(child)"
        :block="child"
      />
    </template>
  </component>
</template>

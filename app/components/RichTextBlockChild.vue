<script setup lang="ts">
import type { Node, Block, Inline, Text } from '@contentful/rich-text-types'
import { INLINES, BLOCKS } from '@contentful/rich-text-types'
import RichTextBlock from '~/components/RichTextBlock.vue'
import RichTextInline from '~/components/RichTextInline.vue'
import RichTextText from '~/components/RichTextText.vue'

const props = defineProps<{
  block: Block | Inline | Text
}>()

if (!props.block) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const isInline = (node: Node) => Object.values(INLINES).includes(node.nodeType)
const isBlock = (node: Node) => Object.values(BLOCKS).includes(node.nodeType)
const isText = (node: Node) => node.nodeType === 'text'

const blockType = computed(
  () => {
    if (isInline(props.block)) {
      return RichTextInline
    } else if (isBlock(props.block)) {
      return RichTextBlock
    } else if (isText(props.block)) {
      return RichTextText
    } else {
      throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
    }
  }
)
</script>

<template>
  <component
    :is="blockType"
    :block="block"
  />
</template>

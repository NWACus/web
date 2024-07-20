<script setup lang="ts">
import type { Node, Inline } from '@contentful/rich-text-types'
import { INLINES } from '@contentful/rich-text-types'
import { ProseA } from '#components'

const props = defineProps<{
  block: Inline
}>()

if (!props.block) {
  throw createError({ statusCode: 404, statusMessage: `Article not found`, fatal: true })
}

const blockType = computed(
  () => {
    return {
      [INLINES.HYPERLINK]: { component: ProseA, props: { href: props.block.data['uri'] } },
      [INLINES.ENTRY_HYPERLINK]: { component: '', props: {} },
      [INLINES.ASSET_HYPERLINK]: { component: '', props: {} },
      [INLINES.RESOURCE_HYPERLINK]: { component: '', props: {} },
      [INLINES.EMBEDDED_ENTRY]: { component: '', props: {} },
      [INLINES.EMBEDDED_RESOURCE]: { component: '', props: {} }
    }[props.block.nodeType]
  }
)

const isInline = (node: Node) => Object.keys(INLINES).includes(node.nodeType)
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

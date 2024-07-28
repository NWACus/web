<script setup lang="ts">
import type { EntryCollection } from 'contentful'
import { compareDesc } from 'date-fns'
import type { TypeBlogPostSkeleton } from '~~/types/generated/contentful'
import type { UBlogPost } from '#components'

const route = useRoute()
if (typeof route.params.avalancheCenter !== 'string') {
  throw createError({ statusCode: 500, statusMessage: `Bad avalanche center: ${route.params.avalancheCenter}`, fatal: true })
}
const avalancheCenter = route.params.avalancheCenter.toUpperCase()
const { data, status, error, refresh } = await useFetch<EntryCollection<TypeBlogPostSkeleton, 'WITHOUT_UNRESOLVABLE_LINKS', 'en'>>('/api/blogs.json', {
  method: 'GET',
  query: { avalanche_center: avalancheCenter }
})

const blogs = computed(
  (): InstanceType<typeof UBlogPost>['$props'][] => {
    const rawBlogs = []
    if (data.value) {
      for (const blog of data.value.items) {
        if (blog) {
          rawBlogs.push(blog)
        }
      }
    }
    rawBlogs.sort((a, b) => {
      return compareDesc(new Date(a.fields.date), new Date(b.fields.date))
    })
    const blogs: InstanceType<typeof UBlogPost>['$props'][] = rawBlogs.map(blog => ({
      to: 'blog/' + blog.fields.slug,
      title: blog.fields.title,
      description: blog.fields.subtitle,
      image: { provider: 'contentful', src: blog.fields.image?.fields.file?.url },
      date: new Date(blog.fields.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }),
      authors: blog.fields.author?.map(author => ({ name: `${author?.fields.firstName} ${author?.fields.lastName}`, avatar: { provider: 'contentful', src: author?.fields.photo?.fields.file?.url || '' }, to: `/${route.params.avalancheCenter}/about/staff?member=` + encodeURIComponent(`${author?.fields.firstName} ${author?.fields.lastName}`) }))
    }))
    return blogs
  }
)
</script>

<template>
  <UPageBody>
    <UBlogList>
      <UBlogPost
        v-for="(post, index) in blogs"
        :key="index"
        :to="post.to"
        :title="post.title"
        :description="post.description"
        :image="post.image"
        :date="post.date"
        :authors="post.authors"
        :orientation="index === 0 ? 'horizontal' : 'vertical'"
        :class="[index === 0 && 'col-span-full']"
        :ui="{
          description: 'line-clamp-2'
        }"
      />
    </UBlogList>
  </UPageBody>
</template>

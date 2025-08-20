'use client'

import { Tag } from '@/payload-types'
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client'
import { FieldDescription, SelectInput, useField, useForm, useFormFields } from '@payloadcms/ui'
import { OptionObject } from 'payload'
import { useEffect, useState } from 'react'

interface QueriedPostsComponentProps {
  path: string
  label?: string
}

interface Post {
  id: number
  title: string
}

export const QueriedPostsComponent: React.FC<QueriedPostsComponentProps> = ({
  path,
  label = 'Queried Posts',
}) => {
  const { value, setValue } = useField<Post[]>({ path })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchedPosts, setFetchedPosts] = useState<Post[]>([])
  const [selectOptions, setSelectOptions] = useState<OptionObject[]>([])
  const { setProcessing } = useForm()

  const filterByTags = useFormFields(([fields]) => fields.filterByTags?.value)
  const sortBy = useFormFields(([fields]) => fields.sortBy?.value)
  const maxPosts = useFormFields(([fields]) => fields.maxPosts?.value)
  const { selectedTenantID: tenant } = useTenantSelection()

  useEffect(() => {
    if (!tenant) {
      return
    }

    const fetchPosts = async () => {
      setIsLoading(true)
      setProcessing(true)

      try {
        const tenantId = typeof tenant === 'number' ? tenant : (tenant as { id?: number })?.id
        if (!tenantId) return

        const params = new URLSearchParams({
          limit: String(maxPosts || 4),
          depth: '1',
          'where[tenant][equals]': String(tenantId),
          'where[_status][equals]': 'published',
        })

        if (sortBy) {
          params.append('sort', String(sortBy))
        }

        if (filterByTags && Array.isArray(filterByTags) && filterByTags.length > 0) {
          const tagIds = filterByTags
            .map((tag: number | Tag) => (typeof tag === 'number' ? tag : tag.id))
            .filter(Boolean)

          if (tagIds.length > 0) {
            params.append('where[tags][in]', tagIds.join(','))
          }
        }

        const response = await fetch(`/api/posts?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch posts')
        }

        const data = await response.json()
        const posts = data.docs || []
        setFetchedPosts(posts)

        const options: OptionObject[] = posts.map((post: Post) => ({
          label: post.title,
          value: String(post.id),
        }))
        setSelectOptions(options)

        // sorting to ensure consistent ordering for comparison
        const currentPostIds = (value || [])
          .map((post) => (typeof post === 'number' ? post : post.id))
          .sort()
        const newPostIds = posts.map((post: Post) => post.id).sort()

        if (JSON.stringify(currentPostIds) !== JSON.stringify(newPostIds)) {
          setValue(posts)
        }
      } catch (error) {
        console.error('Error fetching posts for BlogList block:', error)
        setFetchedPosts([])
        setSelectOptions([])
        setValue([])
      } finally {
        setIsLoading(false)
        setProcessing(false)
      }
    }

    fetchPosts()
  }, [filterByTags, sortBy, maxPosts, tenant, setValue, value, setProcessing])

  const currentValue = fetchedPosts.map((post) => String(post.id))

  return (
    <div className="field-type">
      <SelectInput
        label={label}
        name={path}
        path={path}
        options={selectOptions}
        value={currentValue}
        hasMany
        readOnly={true}
        isClearable={false}
        placeholder={isLoading ? 'Loading posts...' : 'No posts match current filters'}
      />
      <FieldDescription
        description={`Posts are automatically updated based on filter settings. ${isLoading ? 'Updating...' : ''}`}
        path={path}
      />
    </div>
  )
}

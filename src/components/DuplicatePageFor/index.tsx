'use client'

import { Page } from '@/payload-types'
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client'
import {
  Banner,
  Button,
  Drawer,
  PopupList,
  toast,
  useConfig,
  useDocumentInfo,
  useFormModified,
  useModal,
  useRouteTransition,
} from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'
import { useCallback, useState } from 'react'

// TODOs
// - Update permissions to only be accessible to super-admins
// - Remove photos from blocks or use a global photo?

export const DuplicatePageFor = () => {
  const { initialData: pageData } = useDocumentInfo()
  const modified = useFormModified()
  const router = useRouter()
  const { options } = useTenantSelection()
  const { startRouteTransition } = useRouteTransition()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  const tenantOptions = options.filter((option) => option.value !== pageData?.tenant)

  const drawerSlug = 'duplicate-page-drawer'

  const { openModal, closeModal } = useModal()
  const [selectedTenantId, setSelectedTenantId] = useState('')

  const removeIdKey = useCallback(<T,>(obj: T): T => {
    if (Array.isArray(obj)) {
      return obj.map(removeIdKey) as T
    }
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([k]) => !k.toLowerCase().includes('id'))
          .map(([k, v]) => [k, removeIdKey(v)]),
      ) as T
    }
    return obj
  }, [])

  const handleDuplicate = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault()
      if (!selectedTenantId) {
        toast.error('Please select a tenant.')
        return
      }

      try {
        const tenant = await fetch(`/api/tenants/${selectedTenantId}`).then((res) => res.json())
        const cleaned = removeIdKey(pageData as Page)
        const { slug, layout, title } = cleaned

        const now = new Date()
        const timestamp = now.valueOf()

        const newPage = {
          layout,
          title,
          tenant,
          slug: `${slug.replace(/^\/([^/]+)\//, `/${tenant.slug}/`)}-${timestamp}`,
        }

        const createRes = await fetch(`/api/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPage),
        })

        if (createRes.ok) {
          const { doc } = await createRes.json()
          setSelectedTenantId('')
          closeModal(drawerSlug)
          toast.success('Page duplicated to tenant!')
          return startRouteTransition(() =>
            router.push(
              formatAdminURL({
                adminRoute,
                path: `/collections/pages/${doc.id}`,
              }),
            ),
          )
        } else {
          const { errors } = await createRes.json()
          throw toast.error(errors[0].message || 'Error duplicating page.')
        }
      } catch (err) {
        toast.error('An unexpected error occurred.')
      }
    },
    [selectedTenantId, removeIdKey, pageData, closeModal, startRouteTransition, router, adminRoute],
  )

  return (
    <>
      <PopupList.ButtonGroup>
        <PopupList.Button onClick={() => openModal(drawerSlug)}>
          Duplicate page to...
        </PopupList.Button>
      </PopupList.ButtonGroup>

      <Drawer slug={drawerSlug} title="Duplicate page to..." gutter={true}>
        <div className="p-6">
          {modified && (
            <Banner>
              <b>Warning:</b> this page has been modified Continuing with duplication will not apply
              changes.
            </Banner>
          )}
          <p className="text-xl mb-4">
            Choose a tenant below. This page will be duplicated for the selected tenant.
          </p>
          <form onSubmit={handleDuplicate}>
            <div className="flex flex-col gap-2">
              {tenantOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tenant"
                    value={option.value}
                    checked={selectedTenantId === option.value}
                    onChange={() => setSelectedTenantId(option.value)}
                  />
                  {String(option.label)}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button buttonStyle="subtle" type="button" onClick={() => closeModal(drawerSlug)}>
                Cancel
              </Button>
              <Button onClick={handleDuplicate} disabled={!selectedTenantId}>
                Duplicate
              </Button>
            </div>
          </form>
        </div>
      </Drawer>
    </>
  )
}

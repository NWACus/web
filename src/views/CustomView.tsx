import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import type { ReactNode } from 'react'

/**
 * The admin chrome plus a titled page body, shared by the custom root views. Payload does not
 * gate root views, so a view that needs a signed-in user must check for one itself.
 */
export function CustomView({
  initPageResult,
  params,
  searchParams,
  title,
  children,
}: AdminViewServerProps & { title: string; children: ReactNode }) {
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <div className="py-8">
          <div className="doc-header__header">
            <h1 className="doc-header__title">{title}</h1>
          </div>
          {children}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

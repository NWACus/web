import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { formatAdminURL } from 'payload/shared'
import type { ReactNode } from 'react'

/**
 * The admin chrome plus a titled page body, shared by the custom root views. Payload does not
 * gate root views itself, so anonymous visitors are sent to the login page first.
 */
export function CustomView({
  initPageResult,
  params,
  searchParams,
  title,
  children,
}: AdminViewServerProps & { title: string; children: ReactNode }) {
  const { config } = initPageResult.req.payload
  if (!initPageResult.req.user) {
    redirect(formatAdminURL({ adminRoute: config.routes.admin, path: config.admin.routes.login }))
  }
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

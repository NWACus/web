import type { AdminViewServerProps } from 'payload'

import { getURL } from '@/utilities/getURL'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { EmbedGeneratorForm } from './EmbedGeneratorForm'

export async function EmbedGenerator({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const { req } = initPageResult
  const currentHost = req.headers.get('host') || req.host
  const baseUrl = getURL(currentHost)

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
            <h1 className="doc-header__title">Embed Code Generator</h1>
          </div>
          <div className="doc-header__after-header">
            <p className="custom-view-description mb-10">
              Generate iframe embed code for A3 providers and courses to use on external websites.
            </p>
          </div>
          <EmbedGeneratorForm baseUrl={baseUrl} />
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

import type { AdminViewServerProps } from 'payload'

import { getURL } from '@/utilities/getURL'
import { CustomView } from '../CustomView'
import { EmbedGeneratorForm } from './EmbedGeneratorForm'

export async function EmbedGenerator(props: AdminViewServerProps) {
  const { req } = props.initPageResult
  const currentHost = req.headers.get('host') || req.host
  const baseUrl = getURL(currentHost)

  return (
    <CustomView {...props} title="Embed Code Generator">
      <div className="doc-header__after-header">
        <p className="custom-view-description mb-10">
          Generate iframe embed code for A3 providers and courses to use on external websites.
        </p>
      </div>
      <EmbedGeneratorForm baseUrl={baseUrl} />
    </CustomView>
  )
}

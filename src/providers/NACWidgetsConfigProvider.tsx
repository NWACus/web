'use client'

import { createContext, use } from 'react'
import invariant from 'tiny-invariant'

export type NACWidgetsConfig = {
  version: string
  baseUrl: string
  devMode: boolean
}

const NACWidgetsConfigContext = createContext<NACWidgetsConfig | null>(null)

export const NACWidgetsConfigProvider = ({
  config,
  children,
}: {
  config: NACWidgetsConfig
  children: React.ReactNode
}) => {
  return <NACWidgetsConfigContext value={config}>{children}</NACWidgetsConfigContext>
}

export const useNACWidgetsConfig = (): NACWidgetsConfig => {
  const config = use(NACWidgetsConfigContext)
  invariant(
    config,
    'NAC widgets config is not available. Ensure NACWidgetsConfigProvider is mounted above this component.',
  )
  return config
}

import { TenantData } from '@/middleware'
import { createClient } from '@vercel/edge-config'
import { normalizePath } from './utils'

const edgeConfigUrl = new URL(process.env.VERCEL_EDGE_CONFIG)
const edgeConfigId = edgeConfigUrl.pathname.replace('/', '')
const token = process.env.VERCEL_TOKEN
const teamId = process.env.VERCEL_TEAM_ID

export async function vercelFetch(path: string, options?: RequestInit) {
  const { headers: headersFromOptions, ...optionsSansHeaders } = options || {}

  const response = await fetch(`https://api.vercel.com/v1/${normalizePath(path)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...headersFromOptions,
    },
    ...optionsSansHeaders,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Request to ${path} failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data
}

export async function updateEdgeConfig(payload: Record<string, unknown>): Promise<void> {
  if (!edgeConfigId || !token || !teamId) {
    console.warn(
      'EDGE_CONFIG, VERCEL_TOKEN, OR VERCEL_TEAM_ID not available, skipping Edge Config update',
    )
    return
  }

  try {
    await vercelFetch(`/edge-config/${edgeConfigId}/items?teamId=${teamId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error('Error updating Edge Config:', error)
    throw error
  }
}

export async function getAllTenantsFromEdgeConfig() {
  const edgeConfigClient = createClient(process.env.VERCEL_EDGE_CONFIG)
  const allItems = await edgeConfigClient.getAll()
  if (!allItems) throw new Error('No items in edge config.')

  const tenants: TenantData = []
  for (const [key, value] of Object.entries(allItems)) {
    if (key.startsWith('tenant_') && value) {
      tenants.push(value as TenantData[number])
    }
  }

  return tenants
}

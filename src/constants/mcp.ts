import type { CollectionSlug, GlobalSlug } from 'payload'

// 'find' exposes it read-only to the MCP server; anything else records why it is left out.
// Keyed by every generated slug, so a new collection or global fails `pnpm tsc` until it is decided.
// See docs/mcp-server.md#adding-a-collection-to-mcp
type McpExposure = 'find' | { excluded: string }

export const MCP_COLLECTIONS: Record<CollectionSlug, McpExposure> = {
  homePages: 'find',
  builtInPages: 'find',
  pages: 'find',
  stationPages: 'find',
  posts: 'find',
  media: 'find',
  galleries: 'find',
  documents: 'find',
  announcements: 'find',
  sponsors: 'find',
  tags: 'find',
  events: 'find',
  eventGroups: 'find',
  eventTags: 'find',
  providers: 'find',
  courses: 'find',
  biographies: 'find',
  teams: 'find',
  tenants: 'find',
  navigations: 'find',
  settings: 'find',
  redirects: 'find',
  sharedMedia: 'find',
  forms: 'find',
  users: { excluded: 'Emails and account data' },
  roleAssignments: { excluded: 'The map of who can do what' },
  globalRoleAssignments: { excluded: 'The map of who can do what' },
  roles: { excluded: 'Low risk, but only useful for debugging RBAC' },
  globalRoles: { excluded: 'Low risk, but only useful for debugging RBAC' },
  'form-submissions': { excluded: 'Whatever the public typed into forms' },
  'payload-mcp-api-keys': { excluded: 'The MCP API keys themselves' },
  'payload-kv': { excluded: 'Payload internal' },
  'payload-locked-documents': { excluded: 'Payload internal' },
  'payload-preferences': { excluded: 'Payload internal' },
  'payload-migrations': { excluded: 'Payload internal' },
}

export const MCP_GLOBALS: Record<GlobalSlug, McpExposure> = {
  nacWidgetsConfig: 'find',
  a3Management: { excluded: 'Internal settings with little to query' },
  diagnostics: { excluded: 'Internal settings with little to query' },
}

// Only find is ever enabled, so no MCP client can create, update or delete anything
export function mcpFindOnly<Slug extends string>(
  exposure: Record<Slug, McpExposure>,
): Partial<Record<Slug, { enabled: { find: true } }>> {
  const enabled: Partial<Record<Slug, { enabled: { find: true } }>> = {}
  const isSlug = (key: string): key is Slug => key in exposure
  for (const key of Object.keys(exposure)) {
    if (isSlug(key) && exposure[key] === 'find') enabled[key] = { enabled: { find: true } }
  }
  return enabled
}

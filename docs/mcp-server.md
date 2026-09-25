# Payload MCP Server

The Payload MCP plugin exposes a [Model Context Protocol](https://modelcontextprotocol.io/) server at `/api/mcp`. This allows AI tools (like Claude Code, Cursor, etc.) to query CMS content directly from the database.

## What it provides

- Config-based access to collections and globals. We have configured **Read-only access** to 24 collections (pages, builtInPages, stationPages, posts, homePages, events, media, galleries, announcements, teams, biographies, sponsors, tags, documents, forms, navigations, settings, redirects, tenants, eventGroups, eventTags, courses, providers, sharedMedia) and the `nacWidgetsConfig` global. See [Adding a collection to MCP](#adding-a-collection-to-mcp) for what is deliberately left out.
- Authentication via API key (Bearer token)
- Access control enforced through Payload's standard RBAC system (the API key's associated user determines what content is accessible in addition to the plugin config limitations)
- **Server instructions** that describe the multi-tenant data model and common query patterns to MCP clients

### Read-only by configuration

The plugin supports `find`, `create`, `update`, and `delete` operations per collection, but we've intentionally restricted all collections to `find` only:

```typescript
pages: { enabled: { find: true } },
posts: { enabled: { find: true } },
// ... same for all collections
```

This is a deliberate security decision — even if an API key is compromised, no data can be modified. In the future, we could selectively enable write operations for specific collections (e.g., `create` on `media` for AI-assisted content workflows) or for specific MCP clients.

### Custom tools

The plugin also supports [custom MCP tools](https://github.com/payloadcms/payload/tree/main/packages/plugin-mcp#custom-tools) — arbitrary functions exposed as tools to MCP clients. We don't use any yet, but this could be useful for operations that don't map to simple CRUD (e.g., triggering revalidation, running reports, or composing multi-step workflows).

## Adding a collection to MCP

**Every new collection or global needs an MCP decision.** Agents can only answer questions about data the server exposes, and a collection that is left off by accident is invisible to them. The default is to expose it.

### Expose it (the default)

Content that editors create and the public site renders — pages, posts, media, events, announcements, redirects, and the like — should be exposed, find-only. Add it to the `collections` object (or `globals`) in the MCP plugin config at `src/plugins/index.ts`:

```typescript
collections: {
  // ... existing collections
  yourCollection: { enabled: { find: true } },
}
```

Keep it read-only (`find: true` only). Then:

1. **Do it before generating your migration.** The plugin stores a `<slug>_find` permission checkbox for every exposed collection on each MCP API key, so exposing a collection adds a column to `payload_mcp_api_keys`. Adding it in the same PR as the collection means one migration instead of two.
2. **Update the server instructions if the collection is not tenant-scoped.** The instructions tell clients to filter everything by `tenant`. A collection without a `tenant` field (like `courses`, `providers` or `sharedMedia`) needs an exception line saying what to filter by instead.
3. **Update the collection list at the top of this doc.**
4. **Tell key holders.** Existing keys have the new checkbox off, so each key's owner must edit the key under **Admin > MCP API Keys** before the new `find<Collection>` tool returns data. Mention this in the PR description.

### Leave it out

Leave a collection out when a leaked key would expose something sensitive and agents have little need for it:

| Not exposed | Why |
| --- | --- |
| `users` | Emails and account data |
| `roleAssignments`, `globalRoleAssignments` | The map of who can do what |
| `form-submissions` | Whatever the public typed into forms (names, emails, messages) |
| `roles`, `globalRoles` | Low risk, but only useful for debugging RBAC; add them if that becomes a need |
| `a3Management`, `diagnostics` (globals) | Internal settings with little to query |

If a new collection belongs in this table, add it here with the reason so the next person does not have to re-decide.

## Setup

### 1. Create an API key

1. Log in to the admin panel as a super admin
2. Navigate to **Admin > MCP API Keys**
3. Click **Create New**
4. Fill in a label (e.g., "Claude Code local dev")
5. The key is bound to the user creating it. Since Payload 3.88 the plugin makes the `user` field read-only on create and update, so a key always acts as its creator; to issue a key for a different user, log in as that user.
6. Toggle **Enable API Key** on
7. Check the collections you want to access (typically all of them for development)
8. Save — copy the generated API key

Only super admins can create, view, or manage MCP API keys.

### 2. Configure your AI tool

Here is an example config for Claude Code (replace with real API keys for your setup):

```
{
  "mcpServers": {
    "avyweb-payload-local": {
      "type": "http",
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    },
    "avyweb-payload-prod": {
      "type": "http",
      "url": "https://avy-fx.org/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### 3. Production

Create a dedicated API key for each environment and user. Do not share API keys across environments.

The MCP plugin is configured in every environment so you can create MCP server configurations/connections for preview environments/dev too.

## Server instructions

The MCP server returns instructions to clients during initialization that describe:

- The multi-tenant data model (tenant-scoped content belongs to a tenant; the exceptions are courses, which belong to a provider, providers, which are global with globally unique slugs, and sharedMedia, which is Shared Content usable by every center)
- How to discover tenants via `findTenants`
- Common query patterns (filtering by tenant, sorting, selecting fields)
- Available where clause operators

These instructions are configured in `src/plugins/index.ts` via `mcp.serverOptions.instructions` and are surfaced automatically in the MCP client's system prompt. The `instructions` option is native to the plugin since Payload 3.84.0.

## Auth depth: the `overrideAuth` hook

The plugin's default API key resolver looks up the key document at `depth: 1`. That populates the key's `user`, but leaves the user's `roles.docs[]` and `globalRoleAssignments.docs[]` as bare IDs, so our RBAC access functions (which need `role.rules`, `globalRole.rules` and `tenant` resolved) deny everything.

We use the plugin's `overrideAuth` option in `src/plugins/index.ts` to fix this without patching the package: it calls the default resolver to validate the key, then re-fetches the user at `depth: 2` and swaps it into the returned access settings before the MCP tools run their access checks. Depth 2 resolves user → assignment docs → role / globalRole / tenant, which is everything `byTenantRole` and friends read.

## Security

- **Read-only by configuration**: Only `find` operations are enabled at the plugin config level (see above)
- **Super-admin-only key management**: The `payload-mcp-api-keys` collection is locked to super admins via `hasSuperAdminPermissions` access control
- **RBAC enforcement**: The API key's associated user determines access. If the user can't read a collection via normal Payload access control, the MCP server won't return that data either
- **Auth depth for deep population**: Our RBAC system requires deeply populated user data to resolve role chains. The `overrideAuth` hook (see above) re-fetches the key's user at depth 2 during authentication
- **No experimental tools**: Payload's experimental MCP tools (schema modifications, auth operations) are automatically disabled in production regardless of config

## Troubleshooting

**"Failed to reconnect" / OAuth discovery errors**: The MCP client is trying OAuth instead of Bearer token auth. Make sure your config includes the `headers` field with `Authorization: Bearer <key>`. Without it, clients fall back to OAuth discovery which this server doesn't support.

**403 on all requests**: The API key may be invalid, expired, or the associated user may lack permissions. Verify the key in the admin panel and check that the user has appropriate role assignments.

**Empty results**: The API key's permissions are per-collection. Check that the relevant collection checkboxes are enabled on the API key in the admin panel. Keys created before a collection was added to the allowlist have that checkbox off until you edit the key.

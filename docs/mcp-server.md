# Payload MCP Server

The Payload MCP plugin exposes a [Model Context Protocol](https://modelcontextprotocol.io/) server at `/api/mcp`. This allows AI tools (like Claude Code, Cursor, etc.) to query CMS content directly from the database.

## What it provides

- Config-based access to collections and globals. We have configured **Read-only access** to 16 collections (pages, posts, events, media, teams, biographies, sponsors, tags, documents, forms, navigations, settings, tenants, eventGroups, eventTags) and the `nacWidgetsConfig` global.
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

## Setup

### 1. Create an API key

1. Log in to the admin panel as a super admin
2. Navigate to **Admin > MCP API Keys**
3. Click **Create New**
4. Fill in a label (e.g., "Claude Code local dev")
5. Associate it with your user account
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

- The multi-tenant data model (all content belongs to a tenant)
- How to discover tenants via `findTenants`
- Common query patterns (filtering by tenant, sorting, selecting fields)
- Available where clause operators

These instructions are configured in `src/plugins/index.ts` via `mcp.serverOptions.instructions` and are surfaced automatically in the MCP client's system prompt.

> **Note**: The `instructions` field is supported via a local patch (`patches/@payloadcms__plugin-mcp.patch`).

## Patch: authDepth and instructions

We maintain a patch on `@payloadcms/plugin-mcp` that adds two features not yet in the upstream plugin:

1. **`authDepth`** — Controls the population depth when authenticating API key users. Our RBAC system requires depth 3 to resolve `globalRoleAssignments.docs[].globalRole.rules`. Without this, access control checks fail silently.

2. **`instructions`** Passes the MCP protocol's `instructions` field through to the underlying SDK. This allows the server to describe its data model and usage patterns to LLM clients.

Both are backwards-compatible and we should open PRs on the plugin for these patches.

## Security

- **Read-only by configuration**: Only `find` operations are enabled at the plugin config level (see above)
- **Super-admin-only key management**: The `payload-mcp-api-keys` collection is locked to super admins via `hasSuperAdminPermissions` access control
- **RBAC enforcement**: The API key's associated user determines access. If the user can't read a collection via normal Payload access control, the MCP server won't return that data either
- **Auth depth for deep population**: Our RBAC system requires deeply populated user data (depth 3) to resolve role chains. The `authDepth` patch ensures the full chain is resolved during authentication
- **No experimental tools**: Payload's experimental MCP tools (schema modifications, auth operations) are automatically disabled in production regardless of config

## Troubleshooting

**"Failed to reconnect" / OAuth discovery errors**: The MCP client is trying OAuth instead of Bearer token auth. Make sure your config includes the `headers` field with `Authorization: Bearer <key>`. Without it, clients fall back to OAuth discovery which this server doesn't support.

**403 on all requests**: The API key may be invalid, expired, or the associated user may lack permissions. Verify the key in the admin panel and check that the user has appropriate role assignments.

**Empty results**: The API key's permissions are per-collection. Check that the relevant collection checkboxes are enabled on the API key in the admin panel.

**TypeScript error on `instructions`**: Run `pnpm install` to ensure the patch is applied. The `instructions` field is added by our local patch.

# Payload MCP Server

The Payload MCP plugin exposes a read-only [Model Context Protocol](https://modelcontextprotocol.io/) server at `/api/mcp`. This allows AI tools (like Claude Code, Cursor, etc.) to query CMS content directly from the database.

## What it provides

- Read-only access to 16 collections (pages, posts, events, media, teams, biographies, sponsors, tags, documents, forms, navigations, settings, tenants, eventGroups, eventTags) and the `nacWidgetsConfig` global
- No create, update, or delete operations are exposed
- Authentication via API key (Bearer token)
- Access control enforced through Payload's standard RBAC system (the API key's associated user determines what content is accessible)

## Setup

### 1. Create an API key

1. Log in to the admin panel as a super admin (`localhost:3000/admin`)
2. Navigate to **Admin > MCP API Keys**
3. Click **Create New**
4. Fill in a label (e.g., "Claude Code local dev")
5. Associate it with your user account
6. Toggle **Enable API Key** on
7. Check the collections you want to access (typically all of them for development)
8. Save — copy the generated API key

Only super admins can create, view, or manage MCP API keys.

### 2. Configure your AI tool

#### Claude Code

```bash
claude mcp add payload-local --transport url --url http://localhost:3000/api/mcp --header "Authorization: Bearer YOUR_API_KEY_HERE"
```

#### Generic MCP client (settings.json)

```json
{
  "mcpServers": {
    "payload-local": {
      "type": "url",
      "url": "http://localhost:3000/api/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY_HERE"
      }
    }
  }
}
```

The dev server must be running (`pnpm dev`) for the MCP server to be reachable.

### 3. Production

In production, use the deployed URL instead of localhost:

```
https://your-domain.com/api/mcp
```

Create a dedicated API key for each environment and user. Do not share API keys.

## Security

- **Read-only by design**: Only `find` operations are enabled at the plugin config level. Even if an API key is compromised, no data can be modified.
- **Super-admin-only key management**: The `payload-mcp-api-keys` collection is locked to super admins via `hasSuperAdminPermissions` access control.
- **RBAC enforcement**: The API key's associated user determines access. If the user can't read a collection via normal Payload access control, the MCP server won't return that data either.
- **Auth override for deep population**: Our RBAC system requires deeply populated user data (depth 3) to resolve role chains. The `overrideAuth` callback re-fetches the user at the correct depth so access checks work correctly.
- **No experimental tools**: Payload's experimental MCP tools (schema modifications, auth operations) are automatically disabled in production regardless of config.

## Troubleshooting

**"Failed to reconnect" / OAuth discovery errors**: The MCP client is trying OAuth instead of Bearer token auth. Make sure your config includes the `headers` field with `Authorization: Bearer <key>`. Without it, clients fall back to OAuth discovery which this server doesn't support.

**403 on all requests**: The API key may be invalid, expired, or the associated user may lack permissions. Verify the key in the admin panel and check that the user has appropriate role assignments.

**Empty results**: The API key's permissions are per-collection. Check that the relevant collection checkboxes are enabled on the API key in the admin panel.

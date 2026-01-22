# Hardcoded Tenant Lookup

Date: 2026-01-22

Status: accepted

Supersedes: [008-edge-config-tenant-lookup.md](./008-edge-config-tenant-lookup.md)

## Context

The Edge Config-based tenant lookup had several drawbacks:

1. **External dependency**: Required Vercel Edge Config service and API tokens
2. **Multiple failure modes**: Edge Config unavailable → cached API fallback → database query
3. **Sync complexity**: Hooks needed to update Edge Config on tenant changes
4. **Middleware latency**: Async lookups added latency to every request
5. **Cookie stored tenant ID**: Required ID-to-slug conversions for URL routing

The list of US avalanche centers is finite (currently 30) and rarely changes. New centers joining are infrequent events that can be handled via code deployment.

## Decision

Replace Edge Config with a **hardcoded list of all US avalanche center slugs** directly in the codebase.

### Key Changes

1. **Single source of truth**: `src/utilities/tenancy/avalancheCenters.ts` contains all valid tenant slugs and custom domains
2. **Synchronous middleware**: Tenant matching is now purely synchronous with no external lookups
3. **Slug-based cookies**: The `payload-tenant` cookie now stores the tenant slug (e.g., `nwac`) instead of numeric ID
4. **Database relationships unchanged**: Tenant relationships still use numeric IDs internally

### Data Flow

```
Request → Middleware matches slug from subdomain/domain
        → Sets cookie: payload-tenant=nwac
        ↓
Admin/API reads slug from cookie
        → Queries tenant by slug when ID is needed
        → Uses ID for relationship operations
```

### Files Removed

- `src/services/vercel.ts` - Edge Config API integration
- `src/utilities/tenancy/getTenants.ts` - Async tenant fetching
- `src/collections/Tenants/hooks/updateEdgeConfig.ts` - Edge Config sync hooks
- `src/collections/Tenants/endpoints/cachedPublicTenants.ts` - Cached API fallback
- `src/utilities/tenancy/getCollectionIDType.ts` - ID type helper
- `src/utilities/tenancy/getTenantIdFromCookie.ts` - Replaced by slug-based function

### Environment Variables Removed

- `VERCEL_EDGE_CONFIG`
- `VERCEL_TOKEN`
- `VERCEL_TEAM_ID`

## Consequences

**Benefits:**

- **Zero external dependencies** for tenant resolution
- **Faster middleware** - synchronous slug matching instead of async API calls
- **Simpler architecture** - no hooks, no fallbacks, no caching layers
- **Type safety** - `ValidTenantSlug` type ensures only valid slugs are used
- **Easier testing** - no need to mock Edge Config or API routes

**Trade-offs:**

- **Code deployment required** to add new avalanche centers
- **Custom domain changes** require code deployment (rare occurrence)

**Migration notes:**

- Existing `payload-tenant` cookies with numeric IDs will be replaced with slugs on next visit
- The Tenants collection `slug` field is now a select field with predefined options

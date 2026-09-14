# Per-Tenant "Globals" Are Unique-Tenant Collections

Date: 2026-06-16

Status: accepted

## Context

Some configuration is conceptually a singleton *per Avalanche Center* — a center has exactly one homepage, one navigation, one settings document. Payload's native Globals are single instances **app-wide**, so they can't model "one per tenant." Payload's multi-tenant plugin did add per-tenant global support, but we removed that plugin ([010-remove-multi-tenant-plugin.md](./010-remove-multi-tenant-plugin.md)) because it didn't fit our RBAC model ([004-rbac.md](./004-rbac.md)), and the upgrade that would have unblocked the plugin's per-tenant globals was itself blocked by an upstream Payload/Next.js bug ([#51](https://github.com/NWACus/web/issues/51)).

## Decision

Model per-tenant singletons as **ordinary collections constrained to one document per tenant** via `tenantField({ unique: true })`, rather than as Payload Globals.

- `HomePages`, `Navigations`, and `Settings` use this pattern.
- The unique constraint on the tenant field enforces the one-row-per-tenant invariant.
- These read as "globals" from a single center's point of view, but are regular collection documents underneath, so they compose with tenant-scoped access control, the reference picker, and revalidation like any other collection.

## Consequences

- "Tenant-scoped global" is a real concept in this codebase (see `DOMAIN_CONTEXT.md`): one document per tenant that behaves like a singleton for that center. True Payload Globals (e.g. `A3Management`, `NACWidgetsConfig`, `Diagnostics`) remain app-wide singletons and are a different thing.
- Don't reach for Payload Globals when the config is per-center — they can't express it. Don't drop the `unique: true` on the tenant field, or the per-tenant singleton invariant breaks.
- If Payload's native per-tenant globals become viable later (the upstream bug behind #51 is resolved and the plugin fits our RBAC), this pattern could be revisited — but migrating away is a non-trivial data/access change.

# Architecture Decision Records

ADRs capture the context and rationale behind significant architectural choices for AvyWeb — the multi-tenant Next.js + Payload CMS platform that serves the NAC avalanche center websites (NWAC, DVAC, SAC, SNFAC) from a single codebase.

Each record loosely follows the [ADR format](https://adr.github.io/) (Context, Decision, Consequences). Start new records from [`000-template.md`](000-template.md) and give them the next sequential number.

## Index

| ADR                                            | Title                                               | Date       | Status                                              |
| ---------------------------------------------- | --------------------------------------------------- | ---------- | -------------------------------------------------- |
| [001](001-payload-cms.md)                      | Payload CMS                                         | 2025-03-18 | accepted                                           |
| [002](002-sqlite-turso.md)                     | SQLite and Turso                                    | 2025-03-18 | accepted                                           |
| [003](003-observability-tools.md)              | Observability Tools                                 | 2025-03-18 | accepted                                           |
| [004](004-rbac.md)                             | Approach to Role-Based Access Control (RBAC)        | 2025-03-18 | proposed                                           |
| [005](005-collection-relation-blocks.md)       | Collection-Relation Blocks                          | 2025-04-18 | accepted                                           |
| [006](006-semantic-class-names-for-themes.md)  | Using Semantic Class Names for Themes               | 2025-04-30 | accepted                                           |
| [007](007-dynamic-tenants-middleware.md)       | Dynamic Tenant Loading in Middleware                | 2025-07-23 | accepted                                           |
| [007](007-persistent-envs-and-file-storage.md) | Persistent Environments Setup and File Storage      | 2025-07-17 | proposed                                           |
| [008](008-edge-config-tenant-lookup.md)        | Edge Config Tenant Lookup                           | 2025-07-26 | superseded by [013](013-hardcoded-tenant-lookup.md) |
| [009](009-built-in-pages.md)                   | Truth behind Built-In Pages                         | 2025-09-20 | accepted                                           |
| [010](010-remove-multi-tenant-plugin.md)       | Removal of Multi-Tenant Plugin dependency           | 2025-10-06 | accepted                                           |
| [011](011-incremental-static-regeneration.md)  | ISR (Incremental Static Regeneration)               | 2025-10-09 | accepted                                           |
| [012](012-non-rbac-access-patterns.md)         | Moving from pure RBAC to a hybrid permission model  | 2025-11-02 | accepted                                           |
| [013](013-hardcoded-tenant-lookup.md)          | Hardcoded Tenant Lookup                             | 2026-01-22 | accepted                                           |
| [014](014-built-in-pages-drive-navigation.md)  | Built-in pages drive navigation (at provision-time) | 2026-05-04 | accepted                                           |

> **Note:** there are two ADRs numbered `007` ([dynamic tenant middleware](007-dynamic-tenants-middleware.md) and [persistent environments](007-persistent-envs-and-file-storage.md)). The number was reused by accident; both are kept as-is to preserve their stable filenames and any existing links. New ADRs should continue from `015`.

## Related reading

These decisions are expanded on in the topic docs:

- RBAC and the hybrid permission model → [004](004-rbac.md), [012](012-non-rbac-access-patterns.md)
- Tenant resolution → [007](007-dynamic-tenants-middleware.md), [008](008-edge-config-tenant-lookup.md), [013](013-hardcoded-tenant-lookup.md)
- ISR / revalidation → [011](011-incremental-static-regeneration.md) and [`../revalidation.md`](../revalidation.md)
- Built-in pages & navigation → [009](009-built-in-pages.md), [014](014-built-in-pages-drive-navigation.md)

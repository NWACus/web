# National Course Catalog (Providers & Courses Are Not Tenant-Scoped)

Date: 2026-06-16

Status: accepted

## Context

Nearly every content collection in this app is tenant-scoped: it carries a `tenantField`, is filtered by tenant in the admin, and is governed by tenant-role access. This is the platform's defining assumption — content belongs to one Avalanche Center.

Avalanche education courses don't fit that model. Courses are accredited by A3 (the American Avalanche Association) and are meaningful nationally: a single provider's catalog should be discoverable across the platform, not siloed inside one center. Some Avalanche Centers also run their own courses, but they participate in the national program as Providers rather than owning a private, center-local course list.

## Decision

Treat **Providers** and **Courses** as a **national, shared catalog that lives outside tenant isolation**. Neither collection has a `tenantField`.

Access is governed by provider relationship and A3-level roles instead of tenant roles (see `byProviderRelationship`, `byProviderOrProviderManager`, and the `A3Management` global's provider-manager role) — see [012-non-rbac-access-patterns.md](./012-non-rbac-access-patterns.md).

## Consequences

- A Course is **not** owned by an Avalanche Center. Centers surface relevant Courses (e.g. via blocks/embeds), but the source of truth is the national catalog.
- Course and Event are deliberately **distinct** entities. Events are tenant-scoped center calendar items; Courses are national education offerings. Do not merge them.
- Provider/Course access cannot reuse the tenant-role access helpers; it relies on the provider-relationship and A3 provider-manager paths.
- Adding tenant-scoping to Courses later would be a breaking data-model and access-control change — avoid "fixing" the missing `tenantField`; its absence is intentional.

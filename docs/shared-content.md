# Adding a Shared Content collection

Shared Content is content no Tenant owns — managed once and usable by every avalanche center. The decisions and the reasons behind them are in [`docs/decisions/022-shared-content.md`](decisions/022-shared-content.md); the domain terms are in [`DOMAIN_CONTEXT.md`](../DOMAIN_CONTEXT.md). This file is the checklist for building one.

`SharedMedia` (`src/collections/SharedMedia/`) is the worked example. Read it alongside this list.

## The checklist

1. **No tenant field.** A Shared Content collection has no `tenantField()` and no `filterByTenant` base list filter. If a center needs to say something of its own about the document, that belongs in a document the center owns, which references the shared one — never in a per-center row inside the shared document.
2. **`access: accessBySharedContent('<slug>')`.** Create, update and delete come from a Global Role rule; read is structural. Never `accessByTenantRole*` — a rule a center Admin can hand out must not control what renders on every other center's site.
3. **`admin.group: SHARED_CONTENT_ADMIN_GROUP`** from `src/constants/sharedContent.ts`, so everything shared sits in one place in the sidebar.
4. **`admin.hidden: ({ user }) => !canReadSharedContent({ collection: '<slug>', user })`.** The same check `access.read` uses, so the sidebar and the API agree.
5. **A revalidation hook.** `afterChange` and `afterDelete` calling `revalidateDocumentReferences({ collection, id })`, honouring `context.disableRevalidate`. See [`docs/revalidation.md`](revalidation.md), which also records the one known gap in the reference walk.
6. **Add the slug to `SHARED_CONTENT_COLLECTIONS`** in `src/constants/sharedContent.ts`. That is what stops "Duplicate Page For…" from clearing references to it when a page is copied to another center.
7. **Register uploads in blob storage.** An upload collection needs an entry in `vercelBlobStorage` in `src/plugins/index.ts` with the same environment prefix as `media`, and a filename prefix of its own — Media and the shared collections share one blob prefix per environment, and tenant files are kept apart only by their slug prefix.
8. **Reach it from a block, not from a new field on an existing tenant-scoped collection.** ADR 022 decision 5: a shared collection with no tenant-scoped twin gets its own block, following [ADR 005](decisions/005-collection-relation-blocks.md). A shared collection that does have a twin — Shared Media's twin is Media — instead adds a source choice to the existing slot, so nothing needs a backfill. `mediaSourceFields` in `src/fields/mediaSource.ts` builds that choice for one image slot; `resolveMediaSource` picks the document to render, and a slot with no source value means the center's own library.
9. **Seed it.** Seed data goes through `upsertGlobals`, not `upsert` — there is no tenant to key on. A "Shared Content Editor" Global Role with `{ collections: ['<slug>'], actions: ['*'] }` and a user holding it lets the write path be exercised locally without a super admin.

## Who can do what

| | read | create / update / delete |
| --- | --- | --- |
| anonymous | ✗ | ✗ |
| Provider User with no Role Assignment | ✗ | ✗ |
| Provider Manager, unless a `read` rule is added to that Global Role | ✗ | ✗ |
| any Tenant Role User, whatever their rules and tenant | ✓ | ✗ |
| Shared Content Editor (a Global Role rule on the collection) | ✓ | ✓ |
| Super Admin | ✓ | ✓ |

Public pages read through the Local API with access overridden, so `access.read` governs the admin panel and REST, not what a center's site can render.

`__tests__/server/bySharedContent.server.test.ts` holds this table as a test. A new shared collection needs no new rows in it — the helpers are generic over the slug.

## What is not Shared Content

- One center's content shown on another center's site. It still has a single owning Tenant.
- The Avalanche Education cluster. A Course is owned by its Provider ([ADR 015](decisions/015-national-course-catalog.md)).
- Page templates. Those will come from a template Tenant and "Duplicate Page For…".

# Adding a Shared Content collection

Shared Content is content no Tenant owns — managed once and usable by every avalanche center. The decisions and the reasons behind them are in [`docs/decisions/022-shared-content.md`](decisions/022-shared-content.md); the domain terms are in [`DOMAIN_CONTEXT.md`](../DOMAIN_CONTEXT.md). This file is the checklist for building one.

`SharedMedia` (`src/collections/SharedMedia/`) is the worked example. Read it alongside this list. `GlossaryTerms` (`src/collections/GlossaryTerms/`) is a smaller one: it is not an upload and nothing references a term, so items 5, 7, 8, 11 and 12 don't apply to it. Its revalidation hook purges the glossary endpoint's cache tag instead, and it seeds through its own idempotent seeder (shared with a data migration) rather than `upsertGlobals`.

## The checklist

1. **No tenant field.** A Shared Content collection has no `tenantField()` and no `filterByTenant` base list filter. If a center needs to say something of its own about the document, that belongs in a document the center owns, which references the shared one — never in a per-center row inside the shared document.
2. **`access: accessBySharedContent('<slug>')`.** Create, update and delete come from a Global Role rule; read is structural. Never `accessByTenantRole*` — a rule a center Admin can hand out must not control what renders on every other center's site. **An upload collection takes `accessBySharedContentWithPermissiveRead` instead**: the document's `url` is the Payload file route, so a public page's `<img>` fetches the bytes anonymously and structural read would 403 it on every center's site. Write is unchanged, and `admin.hidden` still uses the structural check, exactly as Media does.
3. **`admin.group: SHARED_CONTENT_ADMIN_GROUP`** from `src/constants/sharedContent.ts`, so everything shared sits in one place in the sidebar.
4. **`admin.hidden: ({ user }) => !canReadSharedContent({ collection: '<slug>', user })`.** The same check `access.read` uses, so the sidebar and the API agree.
5. **A revalidation hook.** `afterChange` and `afterDelete` calling `revalidateDocumentReferences({ collection, id })`, honouring `context.disableRevalidate`. See [`docs/revalidation.md`](revalidation.md), which also records the one known gap in the reference walk.
6. **Add the slug to `SHARED_CONTENT_COLLECTIONS`** in `src/constants/sharedContent.ts`. That is what stops "Duplicate Page For…" from clearing references to it when a page is copied to another center.
7. **Register uploads in blob storage, in a folder of their own.** An upload collection needs an entry in `vercelBlobStorage` in `src/plugins/index.ts` whose prefix is a folder under the environment's, as `getSharedMediaBlobPrefix` gives Shared Media (`prod/shared`), and its `prefix` field must default to the same value. Tenant files sit directly in the environment's folder and are kept apart only by the tenant slug on their filename, so a shared file there could overwrite one. `src/scripts/update-media-prefix.ts` rewrites stored prefixes after prod is synced to dev; add the collection there too.
8. **Reach it from a block, not from a new field on an existing tenant-scoped collection.** ADR 022 decision 5: a shared collection with no tenant-scoped twin gets its own block, following [ADR 005](decisions/005-collection-relation-blocks.md). A shared collection that does have a twin — Shared Media's twin is Media — instead adds a source choice to the existing slot, so nothing needs a backfill. `mediaSourceFields` in `src/fields/mediaSource.ts` builds that choice for one image slot; `resolveMediaSource` picks the document to render, and a slot with no source value means the center's own library. The unselected half is cleared on save, so it never records a use of a photo the slot does not show.
9. **Seed it.** Seed data goes through `upsertGlobals`, not `upsert` — there is no tenant to key on. A "Shared Content Editor" Global Role with `{ collections: ['<slug>'], actions: ['*'] }` and a user holding it lets the write path be exercised locally without a super admin.
10. **Give readers a way to suggest an edit.** Spread `SHARED_CONTENT_EDIT_CONTROLS` into `admin.components.edit.beforeDocumentControls`, then run `pnpm generate:importmap`. `SuggestEditDrawer` shows itself only to users whose `docPermissions.update` is false, and its server action emails `SHARED_CONTENT_SUGGESTIONS_EMAIL` with the suggester as the reply-to, so the email thread is the workflow (ADR 022 decision 6). The action refuses any slug outside `SHARED_CONTENT_COLLECTIONS` and names the document from what it reads on the server, never from the client. Suggestions never live inside the shared document as drafts.
11. **Count what uses it.** Add `referenceCountField()` and the slug to `REFERENCE_COUNTED_COLLECTIONS`, then register `syncReferenceCounts` / `syncReferenceCountsOnDelete` on every collection carrying `documentReferencesField()` — a reference is recorded on the document doing the referencing, so that is the only place that knows when one appears or goes away. The hook recounts rather than increments, so a missed event costs one stale number instead of permanent drift, and it counts drafts so the column agrees with the panel. It writes through `payload.db.updateOne` rather than the Local API: a nested `update` merges its `context` into the caller's shared `req`, which would switch off revalidation for the rest of a bulk publish or delete, and it would also stamp `updatedAt` and drop an editor's edit lock. A reference to a deleted document is skipped, not an error. `__tests__/server/referenceCountCoverage.server.test.ts` fails if a referencing collection forgets to register them.
12. **Show what a change would affect.** Add a `ui` field rendered by `@/components/SharedContent/WhereThisIsUsed#WhereThisIsUsed`. The "Where this is used" panel lists every document that uses this one — center, type, title, status, admin link — including drafts, because an unpublished page that uses the document is exactly what an editor deciding whether a change is safe needs to see. It renders only for someone who can update the shared document: the list spans every center, drafts included, and is not filtered by what the viewer could read. It renders through Payload's own `Table`, `Pill` and `FieldLabel`, so it looks like the rest of the admin rather than like a custom widget.

## The Shared Content Editor in production

Production should have a Global Role named "Shared Content Editor" with one rule per shared collection, e.g. `{ collections: ['sharedMedia'], actions: ['*'] }`, assigned in **Global Role Assignments** to whoever manages the shared library. No migration or seed creates it: a super admin set it up by hand when Shared Media first deployed. So if an editor can't write to a shared collection, first check that the role exists and has a rule for that collection. A new shared collection needs its rule added to this role by hand once it deploys.

Without the role only super admins can write. Read needs nothing, because it is structural: every Tenant Role User can already see a shared collection.

## Who can do what

| | read | create / update / delete |
| --- | --- | --- |
| anonymous | ✗ | ✗ |
| Provider User with no Role Assignment | ✗ | ✗ |
| Provider Manager, unless a `read` rule is added to that Global Role | ✗ | ✗ |
| any Tenant Role User, whatever their rules and tenant | ✓ | ✗ |
| Shared Content Editor (a Global Role rule on the collection) | ✓ | ✓ |
| Super Admin | ✓ | ✓ |

Public pages read documents through the Local API with access overridden, so outside upload collections `access.read` governs the admin panel and REST, not what a center's site can render. The read column above is `accessBySharedContent`. With `accessBySharedContentWithPermissiveRead` every row reads ✓, including anonymous; the write column is the same either way, and `admin.hidden` follows the strict check regardless.

`__tests__/server/bySharedContent.server.test.ts` holds this table as a test. A new shared collection needs no new rows in it — the helpers are generic over the slug.

## What is not Shared Content

- One center's content shown on another center's site. It still has a single owning Tenant.
- The Avalanche Education cluster. A Course is owned by its Provider ([ADR 015](decisions/015-national-course-catalog.md)).
- Page templates. Those will come from a template Tenant and "Duplicate Page For…".

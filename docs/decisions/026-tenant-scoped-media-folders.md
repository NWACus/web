# Tenant-scoped Media folders

Date: 2026-10-19

Status: accepted

## Context

[#307 — Folder structure for Media](https://github.com/NWACus/web/issues/307) asks for folders in Media (`Bios/`, `Blog Images/`). Payload ships folders (`folders: true` on a collection, plus a root `folders` config), marked beta upstream: it "may change in minor versions".

Payload's folders were built for single-tenant sites, and four facts about them shaped the design:

- **One folder collection serves every folder-enabled collection.** Payload generates `payload-folders` at config sanitization. It has no tenant field, and its access lets any logged-in user read and write every folder. The only hook into it is the root config's `collectionOverrides`.
- **The `folder` field on Media is also added at sanitization**, after our collection config is written. We cannot give it `filterOptions` or a field-level `validate`.
- **Folder views apply each collection's `admin.baseListFilter`**, at the root and in the move-to-folder drawer. Inside a folder, though, Payload loads the contents through the folder's polymorphic `documentsAndFolders` join, and a join's `where` cannot query a related field. `filterByTenant`'s `'tenant.slug'` constraint fails there with `QueryError: The following path cannot be queried: tenant.slug`.
- **`byTenantRole` returns `true` when the user holds the role in the selected tenant.** For REST, that grants every tenant's documents, so filtering the folder views alone would still let a SAC admin list, rename or delete NWAC's folders through `/api/payload-folders`.

We dropped `@payloadcms/plugin-multi-tenant` in [ADR 010](010-remove-multi-tenant-plugin.md). Its folder support (an override adding a tenant field, base filter and tenant access) is the model, rebuilt on our own tenancy.

## Decision

1. **Folders are a tenant-scoped collection, assembled in `collectionOverrides`** (`src/collections/Folders/index.ts`): `tenantField()`, a base filter, tenant access, and two `beforeValidate` guards. Payload's own fields and hooks (reparenting, subfolder deletion, `folderType`) are kept.

2. **Folder-enabled collections filter by tenant ID.** Folders and Media use `filterByTenantID`, which resolves the selected tenant's ID once and constrains `tenant` by ID, so the same filter works in list views and inside folder joins.

3. **Folder access is narrower than `byTenantRole`.** Folders use Media's permissions, because they exist to organize media. When `byTenantRole` grants `true` and a tenant is selected, read, update and delete become `{ tenant: { equals: <selected tenant ID> } }`, so the REST API matches what the folder views show. This applies to folders only. The same gap exists in every collection that uses `accessByTenantRole`, and closing it there is a separate change.

4. **A folder and its contents always share a tenant, enforced server-side.** `validateFolderTenant` runs on the folder collection and on every folder-enabled collection. It rejects filing a document in, or nesting a folder under, another tenant's folder, and moving a filed document to another tenant. `keepFolderTenant` makes a folder's tenant immutable: the tenant field follows the admin's tenant selector, so a changed value is reverted rather than rejected.

5. **Folders are deleted with their tenant** through `TENANT_SCOPED_COLLECTIONS`.

## Consequences

- Enabling folders on another collection (Documents is the obvious next one) means `folders: true`, `baseListFilter: filterByTenantID`, and `validateFolderTenant` in its `beforeValidate` hooks. `__tests__/server/folders.server.test.ts` asserts this for Media only.
- Folders are beta upstream. A Payload upgrade can change the generated collection's shape or the folder views' queries. `__tests__/server/folders.server.test.ts` covers our override against a stand-in, not Payload's real generated collection, so re-check folder browsing in the admin after Payload upgrades.
- Creating a folder through REST with an explicit `tenant` the user has no role in is not blocked, the same as every other collection using `tenantField()`. The admin UI always sends the selected tenant.
- Folders are excluded from the MCP server: they are admin-only organization.

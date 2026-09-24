# Shared Content: no owning Tenant, written by Global Role, readable by every center

Date: 2026-09-21

Status: accepted

## Context

Nearly every content collection in AvyWeb is tenant-scoped. [#564 — Shared Content (Pages, Media, etc.)](https://github.com/NWACus/web/issues/564) asks for the opposite: content managed once and usable by every Avalanche Center. The first collection is a shared library of photos and videos. The forecast glossary (ADR 018, on the `native-product-pages` branch) and reusable content will follow.

Four facts shaped the permission model:

- **Rules are collection × action, and tenant Roles are handed out by centers.** The seeded center Admin role has `roleAssignments: *`, and the escalation check lets a user assign any Role whose rules their own rules cover. Global Role Assignments are made only by Super Admins.
- **Shared Content renders on every center's site**, so the power to change it is cross-Tenant power.
- **Public pages read documents through the Local API with access overridden.** For most collections, `access.read` governs only the admin panel and REST, not what a public site can render. Upload collections are the exception: a document's `url` is the Payload file route, which runs `access.read` on every anonymous `<img>` request.
- **There is a precedent outside Tenant isolation, and it is not the same thing.** The national course catalog ([ADR 015](015-national-course-catalog.md)) has no tenant field either, but a Course is owned by its Provider and access follows that relationship ([ADR 012](012-non-rbac-access-patterns.md)). Nobody owns Shared Content.

A proof of concept on the `global-pages` branch took a different route: a `GlobalPages` collection where each shared page holds an `avyContent` array with one row per Tenant, and center editors get collection-level `update` on the shared document so they can edit their row.

## Decision

1. **Shared Content is content no Tenant owns.** Its collections have no tenant field. Three things are deliberately outside the term. One center's content shown on another center's site ([#671 — Location Based Events](https://github.com/NWACus/web/issues/671), [#808 — A3 courses can display alongside avalanche center events](https://github.com/NWACus/web/issues/808)) still has one owning Tenant and needs no new write model. The Avalanche Education cluster is Provider-owned. Page templates will come from a template Tenant and "Duplicate Page For…", not from a shared collection.

2. **Only a Global Role rule grants write.** Create, update and delete on a shared collection use `byGlobalRole`. Super Admins match through their wildcard rule. Anyone else gets a "Shared Content Editor" Global Role, which is data in the admin panel rather than code, and a Global Role Assignment. A tenant Role rule never grants write on a shared collection. If it did, a center Admin could pass that rule to anyone in their Tenant, and a grant made by one center would control what renders on every other center's site.

3. **Read is structural.** A user can read a shared collection if they hold at least one Role Assignment that names a Role, or a Global Role rule matching `read` on it. The same synchronous check drives `admin.hidden`. A Provider User with no Role Assignment cannot read, and a Provider Manager can only if the rule is added to that Global Role. We rejected listing each shared collection on the tenant Role documents, because every new shared collection would then need those documents edited by hand in production. We rejected "any authenticated user" because it lets provider accounts in.

   **A shared upload collection is the exception, and its documents are world readable.** A public page's `<img>` fetches the bytes anonymously through the file route, so structural `read` would return 403 on every center's site. Media and Documents already pair `read: () => true` with a stricter `admin.hidden`; `accessBySharedContentWithPermissiveRead` does the same for shared uploads, so `admin.hidden` and write are unchanged while REST read on the collection is as open as it already is on `media`. Every other shared collection uses `accessBySharedContent` and keeps structural read, including on its versions.

4. **A Shared Content document never contains a part that one center owns.** Anything local lives in a document the center owns, which references the shared one. This sets aside the `global-pages` two-tier model. Its per-center isolation lived only in a custom admin component. Payload field access applies to a whole field, not to one row of an array, so nothing server-side stopped one center's editor from rewriting another center's row, and because `meta` and `_status` carried no field-level access the same editor could change or unpublish the shared page for everyone. Closing that would take hooks that compare rows on every save. The POC's rendering work can still be reused.

5. **Centers use Shared Content by reference.** A shared collection with no tenant-scoped twin gets its own block, following [ADR 005](005-collection-relation-blocks.md). Shared Media is the exception, because its twin, Media, already sits inside many blocks: an image slot gains a "Center library / Shared library" choice and a second upload field pointing at `sharedMedia`. A slot with no source value means Center library, so existing content needs no backfill, including blocks stored as JSON inside Post rich text. We rejected converting the existing upload fields to point at two collections, because 26 tables hold a direct column to `media` and each would need a hand-written data move. We rejected making `tenant` optional on Media, because a Global Role rule on `media` cannot mean "only the shared rows". Copying a shared item into a center's own Media may be added later; nothing here depends on it.

6. **Suggestions and contributions go through a Shared Content Editor.** A "Suggest an Edit" button, shown to anyone who can read but not update, opens a free-text drawer and emails `SHARED_CONTENT_SUGGESTIONS_EMAIL` with Reply-To set to the suggester, so the email thread is the workflow. The "Where this is used" panel is the reverse: shown only to those who can update, because it lists every center's documents, drafts included. Suggestions never live inside the shared document as Payload drafts: there is one draft head per document, so a second center's suggestion would overwrite the first, and it would reopen write access to center users. A center that wants to add to a shared collection sends the material to an editor, or a Super Admin grants a Global Role for a while.

## Consequences

- A new shared collection needs no change to Role documents in production. A new writer needs one Global Role Assignment.
- ADR 012 listed the mechanisms that grant access besides role rules. Structural read is one more. Its source is visible in the admin panel as the user's Role Assignments.
- A shared upload collection's list and document endpoints are public, the same as `media` today. `admin.hidden` still follows the structural check, so the admin panel behaves as decision 3 describes. A shared collection that is not an upload collection keeps structural read on both.
- "Where is this used" and revalidation ride on `documentReferences`. Extraction reads the collection config, so a field pointing at a shared collection is recorded on save, and `findDocumentsWithReferences` has no tenant filter. One gap: it drops a referencing document that has no tenant, so a Shared document referencing another Shared document stops the recursive walk. Fix it when the first such chain exists.
- "Duplicate Page For…" clears every upload and relationship field in the copied layout. It must keep references that point at Shared Content, which are valid in any center.
- Adoption is opt-in and heavier than the POC. A shared page does not appear on a center's site until that center builds a Page and embeds it.
- Shared photos work only in image slots that have adopted the source choice. Coverage grows slot by slot.
- ADR 018 says "Public read; super-admin write" for Glossary Terms. It should be updated to this model when the glossary is built: read is structural, and the public receives terms through the glossary's own endpoint.

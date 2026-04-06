# Revalidation

Revalidating paths and tags after content changes in order to serve fresh content is a fundamental aspect of Next.js development. Static pages will show old content if we don't invalidate the cache and trigger a rebuild of that content using [ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration).

When we add new collections and website paths we need to consider the implications on revalidation. Look for "**🧑‍💻 Code to update**" to know where to update things when adding new collections/globals.

[Collection relationship blocks](./decisions/005-collection-relation-blocks.md) complicate revalidation for this codebase because a document may appear in a block embedded on many different paths. We have helpers to identify where a given document appears.

## Architecture Overview

The revalidation system operates on three main principles:

1. **Path-based revalidation** - Using Next.js `revalidatePath()` to invalidate specific routes
2. **Tag-based revalidation** - Using Next.js `revalidateTag()` to invalidate cached data with specific tags
3. **Reference tracking** - Finding all routable collections that reference a changed document through blocks or relationships

## Collection Types

Collections in this system fall into two main categories for revalidation purposes:

### Routable Collections
**Collections that generate frontend routes/paths** and require direct path revalidation:
- Currently: `pages`, `posts`, `homePages`
- Future: Any collection that will have dedicated frontend routes
- Characteristics: Generate URLs (may or may not have slugs), need comprehensive path + reference revalidation

### Reference Collections
**Collections that are referenced by routable collections** but don't have their own frontend routes:
- Examples: `media`, `teams`, `biographies`, `tags`, `forms`
- Characteristics: Only need reference-based revalidation when changed
- When modified, trigger revalidation of routable collections that reference them

## Core Utilities

### `revalidateDocument.ts`
Central function for revalidating routable collections (currently pages, posts, and homePages). Handles:
- Multi-tenant path resolution (`/slug` and `/tenant/slug`)
- Collection-specific URL patterns (e.g., pages use navigation paths, posts use `/blog/slug`, homePages use `/` and `/{center}/`)
- Navigation path discovery for collections that integrate with navigation

**🧑‍💻 Code to update**: This function must be updated when new routable collections are added. Each new routable collection needs its URL pattern logic added here.

### `revalidateBlockReferences.ts`
Finds and revalidates all routable collections that contain a document through content blocks:
- Uses `findDocumentsWithBlockReferences()` to locate referencing documents
- Handles block-based relationships in layouts and content
- Calls `revalidateDocument()` for each found reference

### `revalidateRelationshipReferences.ts`
Finds and revalidates all routable collections that reference a document through relationship fields:
- Uses `findDocumentsWithRelationshipReferences()` to locate referencing documents
- Handles direct relationship field references
- Calls `revalidateDocument()` for each found reference

### Reference Finders

#### `findDocumentsWithBlockReferences.ts`
Queries routable collections for block-based references:
- **Pages**: Searches `layout.{fieldName}` for block references
- **Posts**: Searches `blocksInContent.collection` and `blocksInContent.docId` for embedded blocks
- **HomePages**: Searches `layout.{fieldName}` for block references
- **🧑‍💻 Code to update**: Must be updated when new routable collections are added

#### `findDocumentsWithRelationshipReferences.ts`
Queries routable collections for relationship field references:
- Uses configuration mappings to identify relationship fields
- Searches all routable collections (currently pages, posts, and homePages)
- Only includes published documents (or all documents for homePages which don't have draft status)
- **🧑‍💻 Code to update**: Configuration mappings must include new routable collections

## Collection Patterns

### Routable Collections
Collections that generate frontend routes implement comprehensive revalidation:

#### Pages (`src/collections/Pages/hooks/revalidatePage.ts`)
- **Path revalidation**: Base paths + navigation-discovered paths for both tenant-scoped and global routes
- **Tag revalidation**: `pages-sitemap-{center}`, `navigation-{center}`
- **Previous version handling**: Revalidates old paths when slug changes or status changes
- **Navigation integration**: Discovers additional paths through navigation structure

#### Posts (`src/collections/Posts/hooks/revalidatePost.ts`)
- **Path revalidation**: `/blog/{slug}` and `/{center}/blog/{slug}`
- **Tag revalidation**: `posts-sitemap-{center}`, `navigation-{center}`
- **Reference revalidation**: Calls both `revalidateBlockReferences()` and `revalidateRelationshipReferences()`
- **Previous version handling**: Handles slug changes and status changes

#### HomePages (`src/collections/HomePages/hooks/revalidateHomePage.ts`)
- **Path revalidation**: `/` and `/{center}/` (affects home page routes)
- **Tag revalidation**: `navigation-{center}`
- **Reference revalidation**: Calls both `revalidateBlockReferences()` and `revalidateRelationshipReferences()`
- **Special considerations**: No slugs (affects root paths), no draft status handling needed

### Reference Collections (Media, Teams, Biographies, etc.)
Collections that are referenced by routable collections but don't have their own frontend routes:

#### Media (`src/collections/Media/hooks/revalidateMedia.ts`)
- Only calls `revalidateBlockReferences()` and `revalidateRelationshipReferences()`
- No direct path revalidation (reference collections don't generate routes)

#### Teams, Biographies, Tags
Similar pattern to Media - only reference-based revalidation since they're reference collections.

### Globals
#### NACWidgetsConfig (`src/globals/NACWidgetsConfig/hooks/revalidateWidgetPages.ts`)
- **Path revalidation**: Specific widget-using pages with Next.js page-level revalidation
- **Tag revalidation**: `global_nacWidgetsConfig` for cached global data

## Reference Tracking

The unified reference tracking system automatically discovers all relationship and block references in any collection's data at save time. This replaces the old per-collection tracking fields (`blocksInContent`, `blocksInHighlightedContent`) and per-collection finder utilities.

### How It Works

1. **`extractDocumentReferences`** (`src/utilities/extractDocumentReferences.ts`) — Config-driven extraction that walks all relationship fields, upload fields, and Lexical block references in a document. Uses the Payload collection config to discover fields automatically.
2. **`populateDocumentReferences`** (`src/hooks/populateDocumentReferences.ts`) — A `beforeChange` hook that calls `extractDocumentReferences` and stores references in the `documentReferences` JSON field, but only when the content hash changes.
3. **`findDocumentsWithReferences`** (`src/utilities/findDocumentsWithReferences.ts`) — Queries the `documentReferences` JSON field across all routable collections to find documents that reference a given collection/ID pair.
4. **`revalidateDocumentReferences`** (`src/utilities/revalidateDocumentReferences.ts`) — Orchestrates the full revalidation flow: finds referencing documents, then revalidates their paths and tags.

### Adding Reference Tracking to New Collections

Add three fields and one hook to any collection that needs reference tracking:

1. Add `documentReferencesField()` to the collection's fields
2. Add `contentHashField()` to the collection's fields
3. Add `populateDocumentReferences` to the `beforeChange` hooks

## Caching Integration

### `unstable_cache` Usage
- **Global data**: `getCachedGlobal()` with tags like `global_{slugName}`
- **Routable collection data**: `getCachedDocument()` with tags like `{collection}_{slug}` (this isn't currently used very much since we need to make query documents based on center + slug typically -- might be a good function to update as we go forward)
- **Navigation data**: Cached with tenant-specific tags

### Tag Naming Conventions
- **Global data**: `global_{globalSlug}`
- **Routable collection data**: `{collection}_{slug}` (again, not used at the moment)
- **Sitemap data**: `{collection}-sitemap-{center}` (for routable collections)
- **Navigation data**: `navigation-{center}`

## Context Controls

### `disableRevalidate` Context
All revalidation hooks respect the `context.disableRevalidate` flag to prevent revalidation during things like:
- Seed script
- Workflow scripts (like `update-media-prefix`)

We should always respect this in new revalidation hooks.

## Guidance for Writing Revalidation Functions

### Reference Collections
Collections that don't have frontend routes but are referenced by routable collections:

1. **Only implement reference-based revalidation**:
   ```typescript
   await revalidateBlockReferences({ collection: 'collectionName', id: docId })
   await revalidateRelationshipReferences({ collection: 'collectionName', id: docId })
   ```

2. **No direct path revalidation** (they don't generate routes)

3. **Implement both `afterChange` and `afterDelete` hooks**

### Routable Collections
Collections that generate frontend routes (currently Pages, Posts, HomePages, future collections):

1. **Implement comprehensive path revalidation** for all possible routes
2. **Include tenant-scoped and global paths** in multi-tenant scenarios
3. **Handle collection-specific routing patterns** (e.g., navigation integration, URL prefixes)
4. **Revalidate relevant tags** (sitemaps, navigation, etc.)
5. **Include reference revalidation** if they can be referenced by other routable collections
6. **Handle previous version revalidation** when slugs or status change

### Adding New Routable Collections
When adding a new collection that will have frontend routes:

1. **Update `revalidateDocument.ts`** - Add URL pattern logic for the new collection
2. **Update finder utilities** - Include the new collection in block/relationship reference queries
3. **Create collection-specific revalidation hooks** - Following the routable collection pattern
4. **Update configuration mappings** - Ensure the new collection is included in relationship mappings
5. **Consider navigation integration** - If the collection uses navigation-based routing

### Multi-tenant Considerations
- Always resolve tenant information for proper path construction
- Include both global (`/slug`) and tenant-scoped (`/tenant/slug`) paths. We've experienced bugs related to the path rewriting that happens in `./middleware.ts` if the global path is not also revalidated even if is is not technically a valid path.
- Use tenant-specific cache tags where applicable
- **HomePages example**: Revalidates both `/` (global) and `/{center}/` (tenant-scoped) for home page routes

## Known Limitations

While our revalidation system handles most content changes automatically, there are some scenarios where on-demand revalidation cannot detect all references:

### Deeply Nested RichText Fields in Blocks

**Problem**: Blocks that contain richText fields (richText nested within blocks) are not automatically tracked by the revalidation system.

**Example Scenario**:
- A Page has a `ContentBlock` in its `layout`
- That `ContentBlock` contains a richText field
- The richText field contains a `MediaBlock` that references a media document
- When the media document is updated, the Page won't be automatically revalidated

**Why This Happens**: PayloadCMS field hooks don't fire for blocks within Lexical's BlocksFeature. See: https://github.com/payloadcms/payload/issues/14156

**Workaround**: Time-based revalidation serves as a safety net. Pages are revalidated periodically (every 10-15 minutes) regardless of content changes.

**Possible Solutions** (not currently implemented):
1. Implement async background jobs that scan all routable collection documents for deeply nested relationships
2. Wait for PayloadCMS to add field hook support for Lexical block features

### Impact on Time-Based Revalidation Settings

Because of these limitations, we cannot set very long time-based revalidation periods. Current settings:

- **Individual pages/posts/homePages**: 600 seconds (10 minutes) - Conservative safety net for deeply nested blocks
- **Blog list pages**: 600 seconds (10 minutes) - Not explicitly revalidated when posts change

These shorter intervals ensure that even deeply nested changes appear within a reasonable timeframe, at the cost of more serverless function invocations and CDN cache misses.

### Best Practices

1. **Avoid deeply nesting richText fields** - Keep richText fields at the top level of collections when possible
2. **Implement explicit tracking** - For critical richText fields, follow the pattern in "Tracking Blocks in Rich Text Fields"
3. **Test revalidation behavior** - After adding new blocks or collections, verify that changes trigger proper revalidation
4. **Monitor cache behavior** - Use production builds locally (see README.md) to test ISR behavior

### Testing ISR Locally

To test ISR and caching behavior locally, you need to run a production build:

1. Set `LOCAL_FLAG_ENABLE_LOCAL_PRODUCTION_BUILDS=true` in `.env` to work around a [better-sqlite3 bug](https://github.com/WiseLibs/better-sqlite3/issues/1155)
2. Set an appropriate `NEXT_PUBLIC_ROOT_DOMAIN` value (e.g., `localhost:3000`)
3. Run `pnpm build` then `pnpm start`
4. Test content changes and verify revalidation behavior

**Note**: Local production builds may show inconsistent caching behavior (like 404s on `/`) that doesn't occur in actual production environments.

See `.env.example` for all "Local flags" available for debugging and local production builds.

## Misc. notes

Running a production build locally (see: ## Testing ISR / Caching & Production Builds in Local Environment in [README.md](/README.md)) can result in inconsistent caching behavior where revalidating some paths (namely the `/` path) causes 404s locally but works as expected in a production environment.

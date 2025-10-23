# ISR (Incremental Static Regeneration)

Date: 2025-10-09

Status: accepted

## Context

There is an excellent [Next.js guide on ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration) in the Next.js docs but this decision doc will highlight a few key behaviors that the team had questions about and explain the time-based revalidations and other settings we've chosen.

A few notable behaviors:
- You can use on-demand revalidation using `revalidatePath`, `revalidateTag` and time-based revalidation using `export const revalidate = {seconds}`. These can and should be used together.
- Time-based revalidation uses the SWR (stale-while-revalidate) pattern. The next request after the timeout will serve the cached, stale/outdated page and generate a fresh server side rendered version of the page in the background and store this in the cache. The next request will serve the cached, fresh page.
- `revalidateTag` will only revalidate the data cache layer. If a page was statically generated based on data from the data cache that is then invalidated by `revalidateTag`, that page will be regenerated on the next visit. The granularity of this means that other data fetched by a given page might still use the cached version of it and using `revalidatePath` is easier to reason about from a high level.
- We use `export const dynamic = 'force-static'` on pages to explicitly ensure they remain statically generated. While `generateStaticParams` normally indicates static rendering intent, calling `draftMode()` in pages allows Next.js to intelligently switch between static and dynamic rendering: pages are statically built at build time, but when draft mode is enabled (via the `__prerender_bypass` cookie), Next.js bypasses `force-static` and renders dynamically at request time. The explicit `force-static` declaration prevents any edge cases where Next.js might incorrectly infer dynamic rendering when draft mode is disabled.

### Deeply nested relationships

We built a system to revalidate specific routes (pages, posts, home pages, other collection-based pages in the future) based on related data embedded on that page changing. See the `/docs/revalidation.md` to understand our approach.

Let's say there is a Biography embedded on a Page in it's `layout` field which is a `blocks` type. When that Biography is updated, our revalidation logic will find that specific Biography relationship in blocks and relationship fields throughout the CMS and revalidate the associated paths. This works for the `richText` type field on the Posts collection as well by using an associated field called `blocksInContent` that is updated using a Payload hook.

This system works quite well but there is a **significant limitation**: blocks with relationships in `richText` fields not in the Posts collection will not be detected by the current revalidation system.

Nested `blocks` type fields are also potentially problematic but we can easily solve for those with custom logic in the collection's revalidate hooks. Teams -> Biographies is the only current example of this. When a Biography is updated, we must also revalidate any associated Teams. See `/src/collections/Biographies/hooks/revalidateBiography.ts`.

A generic solution for all `richText` type fields used in other collections besides Posts and Home Pages and blocks that could be embedded in many places would require a solution where we keep track of the blocks in _every_ `richText` type field in an associated `blocksInContent` field and then use those fields to query for relationships using the Payload Local API like we do for the Posts collection.

Possible solutions:
- Every `richText` type field used in a block would have a `FieldHook` (probably `beforeChange`) that would look for a `blocksInContent` field on the document that it's embedded in. We would need to write this in a way where the block could be very deeply nested and still find the parent document. Hypothetically these parent documents would only be the Pages, Posts, and Home Pages collections (or any new collections we add that will need to be added to our revalidation utility functions). This would mean adding `blocksInContent` fields for `blocks` type fields too so that `richText` type fields nested in those blocks would be able to find a `blocksInContent` field to update.
- Start an async job on collections' revalidation hooks that runs in the background and let's the revalidation of `blocks` type fields, `relationship` type fields, and top-level `richText` type fields complete before it completes. This job would then perform a very expensive operation where it pulls down all Pages, Posts, Home Pages, etc. for the tenant and searches the Lexical nodes for the associated relationships. This wouldn't cost us performance but it would cost us in terms of resource usage. Although, that may be negligble.

Challenges:
- We might not be able to accomplish the same logic we have in `src/collections/Posts/hooks/populateBlocksInContent.ts` using `FieldHook`s because it seems that `FieldHook`s don't fire on blocks in Lexical's BlockFeatures. See issue: https://github.com/payloadcms/payload/issues/14156
- Performance concerns:
  - Lexical AST walking happening on every beforeChange (not the case for the async job approach, though)
  - 12+ fields × multiple nested levels × potentially large documents
  - Database queries to find references would expand significantly
  - Could impact editing experience, especially for large documents
- Significant changes required:
  At minimum:
  1. Create reusable field generator (new utility)
  2. Update 12 field definitions
  3. Extend getBlocksFromConfig.ts to discover all richText blocks
  4. Rewrite findDocumentsWithBlockReferences.ts query logic significantly
  5. Handle draft status checking differently
  6. Extensive testing across all affected collections/blocks

## Decision

- [x] Add special handling for home page `richText` field (highlightedContent)
- [x] Document how to handle specific `richText` fields like posts and home page
- [x] Document limitations of revalidations - in public docs too
- [x] Keep our time-based revalidations relatively low

## Consequences

The major downsides here are:
1. Relationships deeply nested in `richText` type fields (inside of `richText` type fields) will not be updated until the time-based revalidation for the page(s) they're embedded on trigger
1. We can't set our time-based revalidations (i.e. cache timeouts) to longer time periods because they need to be short enough that a user can reasonably wait that amount of time for pages with a given relationship embedded on them to revalidate

This means that we have more load on our serverless functions instead of on the Vercel CDN and will be less performant.

It would be great to resolve this issue in the future but we'd need https://github.com/payloadcms/payload/issues/14156 to be resolved.

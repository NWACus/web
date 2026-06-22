# Page Series: grouping, listing, and sequential navigation for Pages

Date: 2026-06-22

Status: accepted

## Context

Pages and Posts have drifted into two different content types, but the only durable difference is **layout plus grouping batteries**, not purpose:

- **Posts** are prose-first (single-column Lexical) and ship with a full grouping/listing toolkit: tags, `publishedAt`/date display, authors, related posts, the `BlogList`/`SingleBlogPost` blocks that dynamically query and render them, and a fixed `/blog/[slug]` namespace.
- **Pages** have flexible multi-column block `layout` but **no grouping or listing mechanism at all**. A Page is surfaced only by being placed in the Navigation by hand. There is no way to list, group, or sequence Pages.

Avalanche centers we are onboarding need to group Page-quality content. Two real examples define the requirement (from Sierra Avalanche Center's existing site):

- **Daily Flow** — a curated *handbook*: ~9 ordered chapters (Introduction → Consider Your Partners → …) with previous/parent/next navigation at the bottom of each page. Order is **editorial and fixed**; it is not dated; it is small.
- **State of the Snowpack** — a *time-based archive*: weekly dated entries that **accumulate continuously** (hundreds over several seasons), with an index page **grouped by year**. Order is **chronological**; membership grows every week.

These two cases pull in opposite directions (curated-and-ordered vs. dynamic-and-dated), so a single rigid model serves one well and the other badly. The original issue proposed a `PageCollections` collection modeled on Teams/Biographies (a container holding an ordered list of member pages). That pattern breaks for the archive case: an ordered relationship array of hundreds of entries is unusable in the admin UI.

## Decision

Add a **Series** concept that brings Posts-style grouping/listing/sequencing to Pages' flexible layout, modeled so it scales from a 9-page handbook to a hundreds-of-entries dated archive.

### Membership and order live on the Page, not on the Series

A thin **`Series`** collection holds only identity and display rules — `name`, `slug`, `tenant`, `landingPage`, and `sortBy` (`manual | date | unsorted`). It does **not** store a member list.

Membership and order live on the **Page**:

- `Pages.series` — a single-valued relationship naming the page's series (at most one, so previous/next is unambiguous). This is the source of truth and the field editors set.
- `Pages.order` — a number used only when the series' `sortBy` is `manual`; ignored for `date` (sorts by `publishedAt`) and `unsorted` (a bag, no sequence).

This "page owns membership" model (rejected alternative: "Series owns an ordered array") is what makes the archive case work. An ordered relationship field must render and re-sort its entire membership at once in the admin UI, which degrades past a few dozen rows; querying `pages where series = X` with pagination never does. The page-owned model also keeps `series`/`order` real, queryable fields and makes switching a series' sort mode a one-field change rather than a data migration.

To preserve a good authoring experience for curated handbooks, the Series edit view gets a **custom organization component** that queries member pages paginated, supports drag-to-reorder and move-to-position (writing `order` back to pages), and shows a read-only list for `date`/`unsorted` series. Each Page shows a read-only "Part of [Series] — #N → link" computed on read (no stored denormalization, so it cannot drift).

### Sequential navigation is page chrome, not a block

Previous/parent/next is rendered server-side at the bottom of member pages from a sibling query (`pages where series = X`, sorted, read-published), so it appears in the HTML for SEO. It is shown only when the page is in a series whose `sortBy` is not `unsorted`. The "parent" target is `Series.landingPage`.

### One block, two presentations

A single **`SeriesBlock`** (added to Pages' layout, not the Posts rich-text feature set) takes a `series` relationship and a `displayAs` toggle: `tableOfContents` (ordered linked list, for the handbook) or `grid` (cards using the page's featured image, optionally grouped by year, for the archive). It is series-driven only; one-off image+link grids are already covered by `ImageLinkGrid`.

### Pages get a featured image

`Pages.meta.image` is replaced by a top-level `featuredImage` mirroring Posts, primarily so the grid presentation has thumbnails. Existing `meta.image` values are migrated to `featuredImage`, the old field is dropped, and `featuredImage` is additionally wired into `generateMetaForPage` as the `og:image` (Pages currently emit no social image).

### Access mirrors Pages

`Series` uses `accessByTenantRoleOrReadPublished` with drafts enabled, so a series must be published to render publicly, exactly like Pages. Member-page queries run with read-published access so only published pages appear in listings and navigation.

### Revalidation

Previous/next creates a sibling dependency the existing `documentReferences` system does not model (neighbors do not reference each other). Explicit hooks on Pages (`series`/`order`/`_status` changes) and Series (`name`/`sortBy`/`landingPage` changes) revalidate the affected series. For v1 these revalidate the **whole series** on any relevant change — simplest and always correct.

## Consequences

**What this enables:**

- A handbook (Daily Flow) authored as ordinary Pages, grouped into a `manual` series, with a table-of-contents block on the landing page and previous/parent/next on each chapter.
- A dated archive (State of the Snowpack) where each weekly entry is a Page that simply names its series; the grid block lists them grouped by year and the archive self-populates as entries are published.
- Pages gain the grouping/listing/sequencing Posts always had, without giving up flexible block layout — narrowing the "why Pages vs Posts" confusion to "Posts are the dated blog feed; Pages are everything else, now groupable."

**Costs and tradeoffs accepted:**

- A custom Series organization component must be built; a native drag-sort field is not possible once membership lives on the page.
- A single-series-per-page constraint (required for unambiguous previous/next).
- The featured-image migration drops `meta.image` (destructive; data copied first, flagged by `migrate:check`).

**Intentionally deferred (notes, not v1):**

- **Revalidation optimization** — invalidate only the changed page, its neighbors, and the landing page on routine insert/publish/delete, reserving whole-series invalidation for `sortBy` changes and `manual` reorders. Whole-series revalidation on every weekly archive entry is wasteful but correct, and the archive cases are where it matters.
- **Landing-page-as-member** — when a page is both its series' landing page and a sequence member (Daily Flow's Introduction), v1 still points the parent button at the landing page even if that is itself; suppressing/relabeling the self-reference and deciding whether the landing page appears in its own listing is deferred.
- **Move-between-series** from the organization component — for v1, changing membership happens on the Page's own `series` field.
- **Multi-series membership** — a page belongs to exactly one series in v1. None of the onboarding centers need a page in multiple series, and the single-series model is the only one that both scales to the dated-archive case and keeps previous/next unambiguous (flat-slug routing carries no series context, so a page in multiple series has no way to pick which sequence to navigate). If multi-membership becomes a real need, the upgrade is a junction collection (`SeriesEntry { series, page, order }`) — which gives multi-membership, per-series ordering, and pagination at scale — plus a `primarySeries` pointer on the page as the previous/next tiebreaker. A hasMany `series` field on the page is explicitly *not* the path, since it cannot express per-series order. Building the junction from the start is far cheaper than migrating single→junction later, so this is a deliberate "revisit when needed" rather than an oversight.
- **URL nesting** — series is a logical grouping only; member pages keep their flat slugs. Nesting URLs under a series would collide with the existing navigation canonical-URL system.

**Superseded thinking:**

- The original `PageCollections`-as-container proposal (Teams/Biographies pattern) is replaced by page-owned membership, because a container's ordered member array does not scale to the dated-archive case.

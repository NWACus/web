# Built-in pages drive navigation, populated at provision-time

Date: 2026-05-04

Status: accepted

## Context

Navigation was previously a mix of hardcoded fallbacks in `Header/utils.ts` and admin-edited entries that didn't compose cleanly with the rest of the CMS. Forecast zone links, observation pages, weather pages, blog, and events were either hand-typed by the admin or filled in by code based on tenant slug. Per-tenant content was rendered from whatever AFP returned from the config.

The [Built-in Pages collection](./009-built-in-pages.md) already existed for the NAC-widget-bearing pages. Extending it to cover forecast zones, observations, weather, blog, and events makes every navigation entry a real `built_in_page` or `page` reference, which was created to be usable as a reference in the content. — usable in link blocks, visible to the reference picker, and queryable.

That extension created a new question: **who keeps `built_in_pages` aligned with upstream sources** (AFP zones, NAC platform toggles)?

[#1038](https://github.com/NWACus/web/issues/1038) designed a continuous reconciler for this:

- Hourly Vercel Cron reconciles every tenant against AFP zones and NAC platforms
- Super-admin "Sync Now" button on the Settings page for on-demand reconciliation
- Same reconciliation function runs during tenant provisioning, so a fresh provision and a sync against an empty starting state produce identical results
- AFP zone add/rename/delete propagates to `built_in_pages` (matched by `afp_zone_id`)
- NAC `platforms.{weather,stations,obs}` toggles add or delete the corresponding `source: 'nac_platform'` rows
- `source` enum (`afp_zone | nac_platform | static`) on `built_in_pages` distinguishes reconciler-owned rows from admin-owned ones

## Decision

**Built-in pages are the source of truth for navigation, populated at provision-time. Defer the continuous reconciler ([#1038](https://github.com/NWACus/web/issues/1038)) until more avalanche centers are on the platform.**

What is implemented:

- All top-level nav tabs flow through a unified `navTab` helper with `displayMode` (`dropdown | link | button`)
- Forecasts, observations, weather, blog, and events are populated with `builtInPage` relationships rather than hardcoded URLs
- Provisioning fetches active forecast zones from AFP and `platforms.weather` from NAC at tenant-creation time and creates the matching `built_in_pages` rows
- A one-time backfill migration (`20260505_045200_backfill_nav_builtin_pages`) brought existing tenants up to the same shape
- Admins are the source of truth for nav structure after provisioning. AFP rename/add/remove of a zone requires an admin to update the `built_in_pages` title/url and re-save the navigation

What is intentionally **not** implemented (deferred to #1038):

- Hourly cron reconciliation of `built_in_pages` against AFP/NAC
- The `source` enum or `afp_zone_id` column on `built_in_pages`
- The "Sync Now" Settings UI
- The unknown-zone-slug → `/forecasts/avalanche` route fallback
- `lastSync*` fields on `tenants.provisioning`

## Consequences

**Why deferring is acceptable:**

- The platform has 3ish tenants (NWAC, SAC, SNFAC) at the time of this decision. Zone changes are rare across those three — the operational cost of an admin manually updating a renamed zone's `built_in_page` is small and contained.
- Provisioning already calls AFP and NAC, so a brand-new tenant lands with correct zones and platforms on day one. The reconciler's job is only to handle drift over time, not initial state.
- The full design from #1038 (event-driven AFP coordination via SNS/SQS, fail-closed NAC client, reconciler module that doesn't touch `navigations`) is captured in the issue. When we revisit, the design stays valid; we're deferring the build, not the thinking.

**What admins must handle manually until #1038 is implemented:**

- AFP renames a zone → admin updates the matching `built_in_pages` title (URL too if the slug changed)
- AFP adds a zone → admin creates a `built_in_pages` row and adds it to the forecasts nav tab
- AFP removes a zone → admin deletes the `built_in_pages` row and removes the nav reference
- NAC platform booleans flip → admin creates or deletes the matching built-in pages:
  - `platforms.weather` → Mountain Weather (`/weather/forecast`)
  - `platforms.stations` → Weather Stations (`/weather/stations/map`)
  - `platforms.obs` → Recent Observations (`/observations`) and Submit Observations (`/observations/submit`)

These changes go unnoticed if no one is watching the upstream. A stale title in nav is the worst likely outcome — the page still resolves and the widgets still render.

**When to revisit:**

- More avalanche centers join the platform and the manual upkeep stops scaling
- Or AFP starts emitting zone events on the SNS topic described in #1038, at which point the consumer side is the cheap part of the work and the cost/benefit flips

**Related follow-up:**

- [#1042](https://github.com/NWACus/web/issues/1042) — warn admins when deleting a document referenced in navigation. Now that nav references are first-class CMS relationships, the delete-warning UX is straightforward; without it, deletes either cascade silently (pages) or fail with a cryptic FK error (built-in pages).

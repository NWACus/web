# Center timezone is a hardcoded fact; AvyWeb owns AFP-derived values

Date: 2026-09-14

Status: accepted

## Context

[#771 — Explicit timezones](https://github.com/NWACus/web/issues/771) needs every avalanche center to have a timezone in AvyWeb so new events default to the center's zone rather than the editor's browser. The issue originally gated this on "a pattern for keeping AFP data stored in AvyWeb in sync," because the NAC center metadata API already reports each center's `timezone`.

Two things had changed since that framing:

- [ADR 014](014-built-in-pages-drive-navigation.md) already settled how AFP-derived data reaches AvyWeb: populate it up front and defer the continuous reconciler in [#1038 — Sync navigation built-in pages with AFP config](https://github.com/NWACus/web/issues/1038).
- The native AFP product pages ([#1135](https://github.com/NWACus/web/issues/1135)) read `metadata.timezone` from the NAC API at render time. The post-noon valid-date rule is AFP semantics defined in the AFP's zone, so those pages must keep using the AFP's value regardless of what AvyWeb stores.

We also considered the shape of a reconciler for this field. A silent AFP → AvyWeb sync is unattractive: a value changed in the AFP dashboard would change AvyWeb behavior with no indication to the person who changed it. An admin-side "AvyWeb differs from the AFP" warning is safer, but a timezone is a geographic constant that never drifts, so a live comparison would render nothing forever. The only real risk is getting the value wrong once.

A check of the NAC API on 2026-09-14 found every center in `AVALANCHE_CENTERS` returns a clean IANA zone, and one that our event picker did not offer: Kachina Peaks (KPAC) is `America/Phoenix`. Arizona does not observe DST, so mapping it to `America/Denver` would be wrong for half the year.

## Decision

1. **Center timezone is hardcoded** in `src/utilities/tenancy/avalancheCenters.ts`, next to the center's name and custom domain, following [ADR 013](013-hardcoded-tenant-lookup.md). It is typed as one of the event picker's supported timezones, and `America/Phoenix` joins that list. Correctness is checked at PR time with `pnpm check:center-timezones`, which compares the constant with the NAC API, rather than at runtime.
2. **Tenant-scoped AvyWeb content uses the center timezone; AFP products use the AFP's.** Events and posts read `AVALANCHE_CENTERS[slug].timezone`. Native product pages keep passing `metadata.timezone` from the NAC API. The display component in [#1175](https://github.com/NWACus/web/issues/1175) takes a timezone as input and is agnostic to which source supplied it.
3. **Courses keep defaulting to the editor's browser timezone.** `startAndEndDateField()` is shared by Events and Courses, but courses belong to a provider ([ADR 015](015-national-course-catalog.md)) and have no tenant, so the admin's selected center says nothing about where the course is held. The center default is opt-in per collection via `startAndEndDateField({ defaultToCenterTimezone: true })`, which only Events passes.
4. **For AFP-derived values that do drift, AvyWeb owns and the AFP advises.** When we build the reconciler in #1038, differences between upstream and AvyWeb should be surfaced to an admin who applies them, not written silently. This amends the "AFP/NAC always wins" authority model drafted in that issue; the "admin always wins for navigation" half stands.

## Consequences

- No migration, seed change, admin field, or runtime NAC fetch for timezone. The value is available synchronously on the server, in middleware, and in admin client components.
- Center admins cannot change a center's timezone. For a geographic constant that is a feature: nobody can shift every event by an hour from the admin panel.
- Adding a center now requires its timezone, and the type forces it to be a picker option. Run `pnpm check:center-timezones` in the PR that adds it.
- The `_tz` columns on events and courses are plain text, so adding a picker option needs regenerated types but no migration.
- Giving Providers their own timezone would let courses default the same way centers do; until then a course provider gets their browser's zone, which is usually the region they teach in.
- #1038's design needs a pass to replace silent overwrites with a visible diff before it is built.

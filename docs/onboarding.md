# Onboarding

Steps for bringing a new avalanche center (tenant) on board.

## Prerequisite: center is new to the AFP

Skip this if the center already appears in the tenant slug dropdown on the admin panel. That dropdown is the static `AVALANCHE_CENTERS` list in `src/utilities/tenancy/avalancheCenters.ts`, so a center recently added to the AFP won't be in it yet.

Run `pnpm check:centers`. It lists AFP centers missing from `AVALANCHE_CENTERS`, with their platforms, name, and timezone, or the reason their metadata doesn't parse yet. For the new center, add an entry keyed by its lowercased AFP id (e.g. `EWYAIX` → `ewyaix`) with its domain as `customDomain` (or a `<slug>.avy-fx.org` placeholder if it has no domain yet), run `pnpm check:centers` again to confirm it passes, and run `pnpm generate:types`. Ship that before creating the tenant.

## Automated

Create the tenant in the admin panel → provisioning runs automatically via `provisionAfterChange`. An **Onboarding Checklist** on the tenant edit page tracks progress. This requires super admin permissions. Creates the tenant record and runs all steps below.

Provisioning is idempotent and can be rerun safely.

### Provisioning status field

The outcome of each provisioning run is stored on the tenant's `provisioning` group field (`status`, `lastRunAt`, `failedPages`) directly on the Tenants collection. The onboarding checklist reads this field directly — it no longer re-derives status from live page/navigation counts, so deleting a page post-provisioning won't un-mark the tenant as complete. Re-running overwrites with the latest outcome (`complete` if everything succeeded, `partial` if some pages failed). The tenant list view renders this status as a Pill in the Provisioning column.

| Step | Details |
|------|---------|
| Website Settings | Created with placeholder brand assets (logo, icon, banner). Replace with real assets via the checklist link. |
| Forecast pages | Queries AFP via `getActiveForecastZones()` to auto-detect single vs multi-zone. Creates zone-specific built-in pages (see table below). Falls back to a default "All Forecasts" page if AFP is unavailable. Every forecast center also gets the archive pages in `ARCHIVE_PAGES` (Forecast Archive, Danger Over Time). Skipped for info exchanges. |
| Default built-in pages | Creates non-forecast built-in pages from the static `BUILT_IN_PAGES` list in `provisionTenant.ts` (see table below). Mountain Weather and the Mountain Weather Archive are only included if the center runs a weather product in NAC: the AFP one every other center uses (`platforms.weather`) or NWAC's own (`platforms.nwac_weather`, read from the center's `config.modules.platforms` in NAC). Info exchanges only get Weather Stations if NAC reports `platforms.stations`. |
| Blank pages | Creates empty pages for every slug in the static `PAGES_TO_PROVISION` list in `provisionTenant.ts`. Info exchanges only get Weather Tools, Learn, About Us, and Donate / Membership (`INFO_EXCHANGE_PAGES_TO_PROVISION`). Admins are expected to fill in the content after provisioning. |
| Home page | Creates a home page with welcome content and quick links to About Us and Donate. Forecast centers get an upcoming events list; info exchanges get observations-focused copy and an Observations Widget block. |
| Navigation | Creates navigation menus linked to all provisioned pages and built-in pages. Forecasts tab is zone-aware (single zone: the zone's forecast then Forecast Archive; multi-zone: "All Forecasts" + a "Zones" accordion with per-zone items + Forecast Archive). The weather tab leads with Mountain Weather when the center has it. Danger Over Time and the Mountain Weather Archive are left out of the nav; they are tabs inside the archive. |
| Edge Config | The `updateEdgeConfigAfterChange` hook automatically adds the tenant to Vercel Edge Config. |

#### Info exchanges

A center is provisioned as an info exchange when NAC reports `platforms.obs` but not `platforms.forecasts` (`isInfoExchange` in `src/services/nac/types/schemas.ts`). There is no tenant field for this (see [ADR 024](decisions/024-info-exchange-derived-from-nac-platforms.md)); confirm the center's platforms with `pnpm check:centers` before creating the tenant. If the NAC platforms query fails, the center is provisioned as a forecast center.

On the frontend, the Forecasts nav tab and forecast/weather routes are already hidden by the same platform flags, and the home page only shows the warnings banner when NAC reports `platforms.warnings`.

#### Built-In Pages

Forecast pages are determined by AFP zone data\*. Non-forecast pages come from the static `BUILT_IN_PAGES` list in `src/collections/Tenants/endpoints/provisionTenant.ts` — edit that list to change what new tenants get.

\* If a center has a single forecast zone, it gets an "Avalanche Forecast" page pointing to that zone. Multi-zone centers get an "All Forecasts" page plus individual zone pages. If AFP is unavailable, a default "All Forecasts" page is created.

Zone slugs come from the last path segment of each AFP zone's `url`, so confirm with the NAC that those URLs are AvyWeb paths (`https://<domain>/forecasts/avalanche/<zone>`) before creating the tenant. A URL with no zone path, like a bare domain, produces a wrong forecast page.

| Title | URL | Source |
|-------|-----|--------|
| All Forecasts | `/forecasts/avalanche` | AFP (multi-zone) |
| _ZONE NAME_ | `/forecasts/avalanche/ZONE` | AFP (multi-zone) |
| Avalanche Forecast | `/forecasts/avalanche/ZONE` | AFP (single-zone) |
| Forecast Archive | `/forecasts/avalanche/archive` | `ARCHIVE_PAGES` constant (every center) |
| Danger Over Time | `/forecasts/avalanche/archive/danger-over-time` | `ARCHIVE_PAGES` constant (every center) |
| Mountain Weather Archive | `/forecasts/avalanche/archive/mountain-weather` | NAC `platforms.weather` |
| Mountain Weather | `/weather/forecast` | NAC `platforms.weather` |
| _Non-forecast pages_ | _varies_ | `BUILT_IN_PAGES` constant |

## Manual steps

### Brand assets

Provisioning fills Website Settings with placeholder images. Ask the center for these three, uploaded through the onboarding checklist link:

| Asset | Shape | Recommended size | Where it shows |
|-------|-------|------------------|----------------|
| Logo | Square (1:1) | At least 512×512 px | Footer (up to 144px wide) and the center's card on the root landing page (192px square box) |
| Icon | Square (1:1) | At least 96×96 px | Browser tab icon (favicon) |
| Banner Logo | Horizontal, roughly 2:1 to 4:1 | At least 160 px tall; 300 px tall is ideal | Site header (80px tall on desktop, 36px on mobile, next to the USFS logo if set) and social share images (150px tall, 80px on zone pages) |

- Use PNG or WebP with a transparent background. The header and footer sit on the center's theme colors, so a white or colored box around the mark shows.
- Logo and banner sizes are at least twice the largest display size, so images stay sharp on high-DPI screens. Smaller uploads still work but look soft.
- Browsers draw the icon at 16–32px, so use a simple mark that stays legible that small rather than the full logo. A non-square icon becomes a squashed or letterboxed favicon.
- Don't reuse the square logo as the banner. It renders as a small square in the header instead of a wordmark.

### Theme

Optional — the default theme works but centers will likely want their brand colors.

- [ ] Add center's theme to `src/app/(frontend)/colors.css`
- [ ] Add center's colors to `centerColorMap` in `src/app/api/[center]/og/centerColorMap.ts` (use header colors)


#### Required colors

Add a new CSS class using the tenant's slug (e.g. `.dvac`) in `src/app/(frontend)/colors.css`. All variables have defaults in `:root`, so you only need to override what differs from the defaults.

| Variable | Purpose |
|----------|---------|
| `--primary` | Primary brand color (buttons) |
| `--primary-hover` | Hover state for primary |
| `--secondary` | Secondary brand color |
| `--secondary-hover` | Hover state for secondary |
| `--link` | Rich-text link color on white and `brand-100`/`200` (`:root` default: `hsl(221 83% 37%)`); must pass 4.5:1 on all three. Darker shades use the block's text color |
| `--link-on-dark` | Optional link color on `brand-700`–`950` (defaults to the block's text color); must pass 4.5:1 on each of those shades |
| `--header` | Header background |
| `--header-foreground` | Header text color |
| `--header-foreground-highlight` | Header highlighted/active text |
| `--footer` | Footer background |
| `--footer-foreground` | Footer text color |
| `--footer-foreground-highlight` | Footer highlighted/active text |
| `--callout` | Callout/CTA background |
| `--callout-hover` | Hover state for callout |
| `--callout-foreground` | Callout text color |
| `--nav-underline` | Active navigation underline color |
| `--brand-50` through `--brand-950` | Brand color range used for block backgrounds |
| `--brand-foreground-50` through `--brand-foreground-950` | Text colors for each brand background. If you override `--brand-*`, set these too: each must reach 4.5:1 (WCAG AA) against its shade, and `brand-foreground-700`–`950` must be light so `--link-on-dark` works |

### Configuring a custom domain in production

1. Update the `PRODUCTION_TENANTS` env var to include the tenant's slug. This should be a comma separated list of slugs (see `src/utilities/tenancy/tenants.ts`).
2. Set the `customDomain` field for the tenant. This should be the host (i.e. `www.deathvalleyavalanchecenter.com`). Confirm that the `customDomain` in the production Edge Config for the tenant matches this.
3. Add this domain to our [list of domains](https://vercel.com/nwac/avy/settings/domains) for avy in Vercel.
4. For domains not managed on Vercel, we'll need to coordinate with the avalanche center to set the appropriate DNS record in their DNS provider's console. Adding a non-Vercel-managed domain will display the records to add and once verified Vercel will automatically generate an SSL certificate. We should include the apex domain -> www. redirect for these custom domains.
5. Add the tenant's custom domain to the list of authorized web analytics urls in PostHog under Settings -> Environment (/settings/environment#web-analytics-authorized-urls)
6. After cutover, run the [post-launch 404 report](not-found-report.md) at launch, about 1 week later, and about 1 month later, and turn the real 404s into redirects.

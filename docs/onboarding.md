# Onboarding

Steps for bringing a new avalanche center (tenant) on board.

## Automated

Create the tenant in the admin panel → provisioning runs automatically via `provisionAfterChange`. An **Onboarding Checklist** on the tenant edit page tracks progress. This requires super admin permissions. Creates the tenant record and runs all steps below.

Provisioning is idempotent and can be rerun safely.

| Step | Details |
|------|---------|
| Website Settings | Created with placeholder brand assets (logo, icon, banner). Replace with real assets via the checklist link. |
| Forecast pages | Queries AFP via `getActiveForecastZones()` to auto-detect single vs multi-zone. Creates zone-specific built-in pages (see table below). Falls back to a default "All Forecasts" page if AFP is unavailable. |
| Default built-in pages | Creates non-forecast built-in pages sourced from the template (DVAC) navigation (see table below). |
| Template pages | Copies all published pages from the template tenant (DVAC). Pages whose blocks all reference tenant-scoped data (teams, sponsors, events, forms) are copied as empty drafts. Demo pages (`blocks`, `lexical-blocks`) are skipped. Static blog/event list blocks are converted to dynamic mode. |
| Home page | Creates a home page with welcome content and quick links to About Us and Donate. |
| Navigation | Creates navigation menus linked to all copied pages and built-in pages. Forecasts tab is zone-aware (single zone: direct link; multi-zone: "All Forecasts" + per-zone items). |
| Edge Config | The `updateEdgeConfigAfterChange` hook automatically adds the tenant to Vercel Edge Config. |

#### Built-In Pages

Forecast pages are determined by AFP zone data\*. Non-forecast pages are sourced from the template tenant's (DVAC) navigation — adding or removing a built-in page in DVAC's nav automatically changes what new tenants get.

\* If a center has a single forecast zone, it gets an "Avalanche Forecast" page pointing to that zone. Multi-zone centers get an "All Forecasts" page plus individual zone pages. If AFP is unavailable, a default "All Forecasts" page is created.

| Title | URL | Source |
|-------|-----|--------|
| All Forecasts | `/forecasts/avalanche` | AFP (multi-zone) |
| _ZONE NAME_ | `/forecasts/avalanche/ZONE` | AFP (multi-zone) |
| Avalanche Forecast | `/forecasts/avalanche/ZONE` | AFP (single-zone) |
| _Non-forecast pages_ | _varies_ | DVAC navigation |

## Manual steps

### Theme

Optional — the default theme works but centers will likely want their brand colors.

- [ ] Add center's theme to `src/app/(frontend)/colors.css`
- [ ] Add center's colors to `centerColorMap` in `src/app/api/[center]/og/centerColorMap.ts` (use header colors)


#### Required colors

Add a new CSS class using the tenant's slug (e.g. `.dvac`) in `src/app/(frontend)/colors.css`. All variables have defaults in `:root`, so you only need to override what differs from the defaults.

| Variable | Purpose |
|----------|---------|
| `--primary` | Primary brand color (buttons, links) |
| `--primary-hover` | Hover state for primary |
| `--secondary` | Secondary brand color |
| `--secondary-hover` | Hover state for secondary |
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
| `--brand-foreground-50` through `--brand-foreground-950` | Text colors for each brand background |

### Configuring a custom domain in production

1. Update the `PRODUCTION_TENANTS` env var to include the tenant's slug. This should be a comma separated list of slugs (see `src/utilities/tenancy/tenants.ts`).
2. Set the `customDomain` field for the tenant. This should be the host (i.e. `www.deathvalleyavalanchecenter.com`). Confirm that the `customDomain` in the production Edge Config for the tenant matches this.
3. Add this domain to `remotePatterns` in `next.config.js`. Example:
```
{
  hostname: 'www.avy-fx-demo.org',
  protocol: PROTOCOL,
},
```
4. Add this domain to our [list of domains](https://vercel.com/nwac/avy/settings/domains) for avy in Vercel.
5. For domains not managed on Vercel, we'll need to coordinate with the avalanche center to set the appropriate DNS record in their DNS provider's console. Adding a non-Vercel-managed domain will display the records to add and once verified Vercel will automatically generate an SSL certificate. We should include the apex domain -> www. redirect for these custom domains.
6. Add the tenant's custom domain to the list of authorized web analytics urls in PostHog under Settings -> Environment (/settings/environment#web-analytics-authorized-urls)

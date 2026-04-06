# Onboarding

Steps for bringing a new avalanche center (tenant) on board.

## Automated

Create the tenant in the admin panel → provisioning runs automatically via `provisionAfterChange`. An **Onboarding Checklist** on the tenant edit page tracks progress. This requires super admin permissions. Creates the tenant record and runs all steps below.

Provisioning is idempotent and can be rerun safely.

| Step | Details |
|------|---------|
| Website Settings | Created with placeholder brand assets (logo, icon, banner). Replace with real assets via the checklist link. |
| Built-in pages | Creates standard pages per the table below. |
| Template pages | Copies all published pages from the template tenant (DVAC). Pages whose blocks all reference tenant-scoped data (teams, sponsors, events, forms) are copied as empty drafts. Demo pages (`blocks`, `lexical-blocks`) are skipped. Static blog/event list blocks are converted to dynamic mode. |
| Home page | Creates a home page with welcome content and quick links to About Us and Donate. |
| Navigation | Creates navigation menus linked to all copied pages and built-in pages. |
| Edge Config | The `updateEdgeConfigAfterChange` hook automatically adds the tenant to Vercel Edge Config. |

#### Built-In Pages

\* If a center has a single forecast zone, it gets an "Avalanche Forecast" page pointing to that zone. Multi-zone centers get an "All Forecasts" page plus individual zone pages.

| Title | URL | For AC with single or multi zone* |
|-------|-----|-----------------------------------|
| All Forecasts | `/forecasts/avalanche` | multi |
| _ZONE NAME_ | `/forecasts/avalanche/ZONE` | multi |
| Avalanche Forecast | `/forecasts/avalanche/ZONE` | single |
| Mountain Weather** | `/weather/forecast` | both |
| Weather Stations | `/weather/stations/map` | both |
| Recent Observations | `/observations` | both |
| Submit Observations | `/observations/submit` | both |
| Blog | `/blog` | both |
| Events | `/events` | both |

\*\* Mountain Weather is only available for centers that have a weather forecast configured.

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

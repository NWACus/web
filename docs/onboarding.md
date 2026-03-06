# Onboarding

Steps for bringing a new avalanche center (tenant) on board.

## Automated

Create the tenant in the admin panel → provisioning runs automatically via `provisionAfterChange`. An **Onboarding Checklist** on the tenant edit page tracks progress. This requires super admin permissions. Creates the tenant record and runs all steps below.

Provisioning is idempotent and can be rerun safely.

| Step | Details |
|------|---------|
| Website Settings | Created with placeholder brand assets (logo, icon, banner). Replace with real assets via the checklist link. |
| Built-in pages | Creates 4 standard pages: All Forecasts, Weather Stations, Recent Observations, Submit Observations. |
| Template pages | Copies all published pages from the template tenant (DVAC). Pages whose blocks all reference tenant-scoped data (teams, sponsors, events, forms) are copied as empty drafts. Demo pages (`blocks`, `lexical-blocks`) are skipped. Static blog/event list blocks are converted to dynamic mode. |
| Home page | Creates a home page with welcome content and quick links to About Us and Donate. |
| Navigation | Creates navigation menus linked to all copied pages and built-in pages. |
| Edge Config | The `updateEdgeConfigAfterChange` hook automatically adds the tenant to Vercel Edge Config. |


## Manual steps

### Theme

Optional — the default theme works but centers will likely want their brand colors.

- [ ] Add center's theme to `src/app/(frontend)/colors.css`
- [ ] Add center's colors to `centerColorMap` in `src/app/api/[center]/og/route.tsx` (use header colors)

### Custom domain

1. Add slug to `PRODUCTION_TENANTS` env var (see `src/utilities/tenancy/tenants.ts`)
2. Set `customDomain` field on tenant (e.g. `www.example-avalanche.com`). Confirm it matches production Edge Config.
3. Add domain to `remotePatterns` in `next.config.js`:
   ```
   { hostname: 'www.example-avalanche.com', protocol: PROTOCOL }
   ```
4. Add domain in [Vercel domains settings](https://vercel.com/nwac/avy/settings/domains)
5. For non-Vercel-managed domains: coordinate DNS records with the avalanche center. Include apex → www redirect.
6. Add domain to authorized web analytics URLs in PostHog (Settings → Environment)

# Onboarding

This outlines steps required when a new center (tenant) comes on board. This doc is focused on the technical changes/tasks required but does mention things that a super admin will take care of as well.

## Checklist

### Code changes

- [ ] Create center's theme in `src/app/(frontend)/colors.css`
- [ ] Copy relevant theme colors to the `centerColorMap` in `src/utilities/generateOGImage.tsx`. We've been using the header colors.
- [ ] Seed data?

### Click ops / manual changes

We also need to get the new tenant into our Vercel Edge Config. Adding a new tenant in production *should* do this via a Payload hook but please verify the entry has been added by checking the Edge Config values in the Vercel dashboard (go to the project -> Storage -> production Edge Config).

- [ ] Create the new tenant in the production admin panel
- [ ] Fill out the new tenant's website settings
- [ ] Create Built-In pages
  | Title | URL | for AC w/single or multi zone*  |
  |--------|--------|--------|
  | All Forecasts | `/forecasts/avalanche`| mutli |
  | _ZONE NAME_ | `/forecasts/avalanche/_ZONE_` | multi |
  | Avalanche Forecast | `/forecasts/avalanche/_ZONE_` | single |
  | Weather Stations | `/weather/stations/map`| both |
  | Recent Observations | `/observations` | both |
  | Submit Observations | `/observations/submit` | both |
  | Local Accidents | `/accidents?impacts=["Humans Caught"]` | both |

- [ ] Copy pages from the template tenant to the new tenant using the "Duplicate to..." functionality (page document view -> three dot menu)

## Configuring a custom domain in production

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

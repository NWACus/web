# Onboarding

This outlines steps required when a new center (tenant) comes on board. This doc is focused on the technical changes/tasks required but does mention things that a super admin will take care of as well.

## Checklist

<table>
  <thead>
    <tr>
      <th>Action</th>
      <th>Method</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Create the new tenant in the production admin panel</td>
      <td>Manual</td>
      <td>—</td>
    </tr>
    <tr>
      <td rowspan="2">Confirm tenant is added to Vercel Edge Config</td>
      <td>Automatic</td>
      <td>Hook: <code>updateEdgeConfigAfterChange</code></td>
    </tr>
    <tr>
      <td>Manual</td>
      <td>Troubleshoot: <br />In Vercel, go to the project → Storage → production Edge Config and edit file</td>
    </tr>
    <tr>
      <td rowspan="2">New tenant option shown in <code>TenantSelectionProvider</code></td>
      <td>Manual</td>
      <td>Refresh page</td>
    </tr>
    <tr>
      <td>Future automation</td>
      <td>Use <code>syncTenants</code></td>
    </tr>
    <tr>
      <td>Create documents for Global Collections <ul><li>Website Settings</><li>Navigation</li><li>Home Pages</li></ul></td>
      <td>Manual</td>
      <td>Visit each global collection to create <br/>→ Fill out required information and save</td>
    </tr>
    <tr>
      <td>Create Built-In pages</td>
      <td>Manual</td>
      <td>See <a href="#built-in-pages">Built-In Pages</a> below</td>
    </tr>
    <tr>
      <td>Copy pages from template tenant to new tenant</td>
      <td>Manual</td>
      <td>Use "Duplicate to..." (page document view → three dot menu)</td>
    </tr>
  </tbody>
</table>



### Built-In Pages

| Title | URL | For AC with single or multi zone* |
|-------|-----|-----------------------------------|
| All Forecasts | `/forecasts/avalanche` | multi |
| _ZONE NAME_ | `/forecasts/avalanche/ZONE` | multi |
| Avalanche Forecast | `/forecasts/avalanche/ZONE` | single |
| Mountain Weather** | `/weather/forecast` | both |
| Weather Stations | `/weather/stations/map` | both |
| Recent Observations | `/observations` | both |
| Submit Observations | `/observations/submit` | both |

> [!NOTE]
> ** Mountain Weather page only exists on select avalanche centers. Check `getAllAvalancheCenterCapabilities` > `platforms > weather`

## Creating the center's theme

This is optional. Our default theme will work but a center will likely want their brand colors to be used.

- [ ] Create center's theme in `src/app/(frontend)/colors.css`
- [ ] Copy relevant theme colors to the `centerColorMap` in `src/utilities/generateOGImage.tsx`. We've been using the header colors.

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
6. Add the tenant's custom domain to the list of authorized web analytics urls in PostHog under Settings -> Environment (/settings/environment#web-analytics-authorized-urls)

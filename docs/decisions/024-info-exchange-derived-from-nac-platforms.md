# Info exchanges are derived from NAC platforms, not stored on the tenant

Date: 2026-09-29

Status: accepted

## Context

[#269 — Support avalanche info exchanges](https://github.com/NWACus/web/issues/269) adds support for Info Exchanges: Avalanche Centers that share public observations but don't issue avalanche forecasts. Provisioning has to treat them differently (no forecast pages, an observations-focused home page, a smaller set of blank pages), so AvyWeb needs a way to tell an Info Exchange from a forecasting center.

The NAC avalanche-centers API already reports per-center `platforms` flags (`forecasts`, `obs`, `stations`, `weather`, `warnings`), and the frontend already reads them at render time: forecast and weather routes 404, and the Forecasts and Observations nav tabs are hidden, based on those flags.

## Considered Options

- **A boolean on the tenants collection** (`isInfoExchange` or `isAvalancheCenter`). Explicit and editable by a super admin, but it's a second source of truth that can disagree with NAC. A center flagged as an info exchange that NAC says forecasts would get an observations home page while the nav still shows a Forecasts tab.
- **A hardcoded list**, e.g. a flag on the `AVALANCHE_CENTERS` entries, following [ADR 013](013-hardcoded-tenant-lookup.md) and [ADR 020](020-center-timezone-is-a-hardcoded-fact.md). That works for facts AvyWeb owns, like a center's timezone. Whether a center forecasts is owned by NAC and already drives the frontend, so a copy in code has the same drift problem as the boolean.
- **Derive it from NAC platforms** (chosen).

## Decision

**A center is an Info Exchange when NAC reports `platforms.obs` but not `platforms.forecasts`.** There is no tenant field and no hardcoded list. The check lives in `isInfoExchange()` in `src/services/nac/types/schemas.ts`.

`!forecasts` alone isn't enough. Some forecasting centers publish on their own platforms and report `forecasts: false` to NAC (UAC reports `obs: false` too; CAIC reports every flag false), and an unknown slug also comes back all-false. Requiring `obs` keeps those on the forecast-center path.

## Consequences

- Classification happens once, at provisioning time, like every other NAC-derived value in [ADR 014](014-built-in-pages-drive-navigation.md). If NAC later flips `forecasts`, the center's pages, home page, and navigation don't change. Rerunning provisioning won't switch paths either, because it only creates what's missing.
- A tenant created before NAC registers its slug is provisioned as a forecast center. Onboarding must confirm the center's platforms with `pnpm check:centers` first (see [`../onboarding.md`](../onboarding.md)).
- NAC's `off_season` flag doesn't affect `platforms`. Forecasting centers keep `forecasts: true` all summer, so seasonality doesn't cause misclassification.

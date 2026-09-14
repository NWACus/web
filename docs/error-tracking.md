# Error Tracking & Analytics

AvyWeb uses **Sentry** for error tracking and **PostHog** for product analytics. Both are active in production and effectively off in local dev. See [ADR-003](decisions/003-observability-tools.md) for why.

## Sentry (`@sentry/nextjs`)

Shared options live in [`sentry-base-config.ts`](../sentry-base-config.ts), imported by every runtime so config stays in one place:

- DSN is hardcoded (the `avy-web` project under the `nwac` org).
- `enabled: NODE_ENV === 'production'` — inert in dev/test.
- `tracesSampleRate: 0` — error tracking only, no performance tracing.
- `environment` comes from `VERCEL_GIT_COMMIT_REF` (falls back to `'local'`), so previews report under their branch name.

Init per runtime: server ([`sentry.server.config.ts`](../sentry.server.config.ts)) and edge ([`sentry.edge.config.ts`](../sentry.edge.config.ts)) are loaded by [`src/instrumentation.ts`](../src/instrumentation.ts) `register()` (which also exports `onRequestError`); the browser inits in [`src/instrumentation-client.ts`](../src/instrumentation-client.ts).

`next.config.js` wraps the build in `withSentryConfig` **only when `NODE_ENV === 'production'**` — `org: 'nwac'`, `project: 'avy-web'`, source-map upload, and `tunnelRoute: '/monitoring'` to route SDK requests past ad blockers. `serverExternalPackages` + a `webpack.ignoreWarnings` entry suppress harmless Sentry/OpenTelemetry import warnings.

Because the SDK keys off production, it won't report from `pnpm dev`; run a local prod build (`pnpm dev:prod`) to exercise it.

### Payload admin panel ([`@payloadcms/plugin-sentry`](../src/plugins/index.ts))

Installs an admin `AdminErrorBoundary` and reports errors from the admin UI and REST API. Our config tunes which HTTP errors get captured:

- `captureErrors: [400, 401, 403, 404]` — by default the plugin only reports `500`-level responses; we additionally capture these client errors (bad request, unauthorized, forbidden, not found) so auth/permission and missing-resource failures surface in Sentry.
- `debug: true` — verbose plugin logging.

## PostHog

PostHog runs as a **same-origin reverse proxy** so analytics aren't ad-blocked: client requests hit `/ingest/*`, which `next.config.js` `rewrites()` to PostHog's US hosts; `skipTrailingSlashRedirect` and the `ingest` exclusion in [`src/middleware.ts`](../src/middleware.ts) keep that path intact.

- **Browser:** [`PostHogProvider.tsx`](../src/providers/PostHogProvider.tsx) calls `posthog.init()` only when `NEXT_PUBLIC_POSTHOG_KEY` is set, pointing `api_host` at `/ingest`. It wraps both `src/app/(frontend)/layout.tsx` and `src/app/(embeds)/layout.tsx`; feature flags and surveys are disabled.
- **Server:** [`src/posthog.ts`](../src/posthog.ts) exposes `PostHogClient()` (`posthog-node`), returning `null` when no key is set.
- **Identity:** users are identified after login via `src/collections/Users/hooks/posthogIdentifyAfterLogin.ts`.

### Environment variables

| Variable                   | Required | Description                                                             |
| -------------------------- | -------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY`  | No       | PostHog project key — PostHog is disabled (client + server) when absent |
| `NEXT_PUBLIC_POSTHOG_HOST` | No       | UI host for links (default `https://us.i.posthog.com`)                  |

Both default to empty in [`.env.example`](../.env.example), so analytics stay off until a key is provided.

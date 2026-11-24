# Error Tracking & Analytics

AvyWeb uses **Sentry** for error tracking and **PostHog** for product analytics. Both are active in production and effectively off in local dev. See [ADR-003](decisions/003-observability-tools.md) for why.

## Sentry (`@sentry/nextjs`)

Shared options live in [`sentry-base-config.ts`](../sentry-base-config.ts), imported by every runtime so config stays in one place:

- DSN is hardcoded (the `avy-web` project under the `nwac` org).
- `enabled: NODE_ENV === 'production'` — inert in dev/test, and also in the mocked E2E build (see below).
- No `tracesSampleRate` / `tracesSampler` — error tracking only. Leaving them unset means no spans are sampled or sent; `0` still runs the sampler on every request. The SDK still propagates trace headers on outgoing requests.
- `sendClientReports: false` — otherwise the SDK posts an envelope reporting every transaction it drops. This applies to the browser too, so Sentry's Stats page no longer shows browser events dropped by rate limiting.
- `environment` is the deployed branch: `release` in production, `main` on the dev deploy, the branch name on previews, and `'local'` otherwise. The browser reads `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, which the `vercel build` step of each deploy workflow sets. The server and edge runtimes read the same variable and fall back to `VERCEL_GIT_COMMIT_REF`. That one can't reach the browser: it is unprefixed, and it only exists at runtime because CI supplies it through `vercel deploy --meta githubCommitRef=…`, after the build has finished. Unlike `NEXT_PUBLIC_POSTHOG_ENVIRONMENT`, which has a fixed value per Vercel environment, this one is set in CI because its value is the branch name, and a Vercel Preview variable can hold only one value across branches. Don't also set it in Vercel: `vercel build` doesn't override variables already in its environment, so the CI value would win.

Init per runtime: server ([`sentry.server.config.ts`](../sentry.server.config.ts)) and edge ([`sentry.edge.config.ts`](../sentry.edge.config.ts)) are loaded by [`src/instrumentation.ts`](../src/instrumentation.ts) `register()` (which also exports `onRequestError`); the browser inits in [`src/instrumentation-client.ts`](../src/instrumentation-client.ts). The server init replaces the Next SDK's default Http integration with `httpIntegration({ disableIncomingRequestSpans: true, trackIncomingRequestsAsSessions: false })`. The first option repeats the SDK's own default, because Next instruments incoming requests itself; the second stops request sessions, which sent ~2.6 envelopes to Sentry per function invocation on every route. The edge runtime has no Http integration, so it needs no override. The browser init drops the `BrowserSession` integration: nobody uses Release Health, and it sent a session envelope through the tunnel on every page load and route change, from every center. Sessions are off in every runtime.

`next.config.ts` wraps the build in `withSentryConfig` **only when `NODE_ENV === 'production'**` — `org: 'nwac'`, `project: 'avy-web'`, source-map upload, and `tunnelRoute: '/monitoring'` to route SDK requests past ad blockers. [`src/middleware.ts`](../src/middleware.ts) excludes `/monitoring` from its matcher (as it does `/ingest`). It has to: the tunnel rewrite runs after middleware, so on a custom domain middleware rewrote `/monitoring` to `/{center}/monitoring`, which rendered the center's 404 page instead of reaching Sentry. Until the exclusion, browser errors and sessions from custom domains never arrived, so Sentry volume rises once it ships.

`withSentryConfig` also sets `experimental.clientTraceMetadata: ['baggage', 'sentry-trace']`, which makes Next render `sentry-trace` and `baggage` `<meta>` tags with a fresh trace ID and `sentry-sample_rand` on every render, even with tracing off. `next.config.ts` removes that key after wrapping. Without it the tags no longer differ on every render, but ISR output still isn't byte-identical: the order of the RSC payload rows varies between regenerations. So this alone doesn't let Vercel skip ISR writes for unchanged pages. Without the tags, the browser SDK starts its own trace instead of continuing the server's. That doesn't matter while tracing is off. Restore the key if tracing is ever turned back on.

`serverExternalPackages` + a `webpack.ignoreWarnings` entry suppress harmless Sentry/OpenTelemetry import warnings.

One exception: the mocked E2E build (`NEXT_PUBLIC_E2E_MOCK_ROLE`) skips `withSentryConfig` entirely. It is a production build, so it would otherwise report every synthetic failure the suite provokes to the real project — and, more importantly, the SDK's module instrumentation is loaded even when reporting is disabled, and does not co-exist with the E2E harness's MSW preload — the two together produce intermittent 5xx from the Payload API. That is an interaction between the two, not a production problem: a normal production build carries Sentry without the preload and does not reproduce it. See [afp-products/e2e-mocks.md](afp-products/e2e-mocks.md).

The `NEXT_PUBLIC_` prefix on that flag is load-bearing, not habit. `sentry-base-config.ts` is imported by the browser copy of the SDK too ([`src/instrumentation-client.ts`](../src/instrumentation-client.ts)), and Next inlines only `NEXT_PUBLIC_` variables into the client bundle — an unprefixed flag reads as `undefined` there, leaving `enabled` true and the browser SDK reporting from the E2E run.

Because the SDK keys off production, it won't report from `pnpm dev`; run a local prod build (`pnpm dev:prod`) to exercise it.

### Payload admin panel ([`@payloadcms/plugin-sentry`](../src/plugins/index.ts))

Installs an admin `AdminErrorBoundary` and reports errors from the admin UI and REST API. Our config tunes which HTTP errors get captured:

- `captureErrors: [400, 401, 403, 404]` — by default the plugin only reports `500`-level responses; we additionally capture these client errors (bad request, unauthorized, forbidden, not found) so auth/permission and missing-resource failures surface in Sentry.
- `debug: true` — verbose plugin logging.

## PostHog

PostHog runs as a **same-origin reverse proxy** so analytics aren't ad-blocked: client requests hit `/ingest/*`, which `next.config.ts` `rewrites()` to PostHog's US hosts; `skipTrailingSlashRedirect` and the `ingest` exclusion in [`src/middleware.ts`](../src/middleware.ts) keep that path intact.

- **Browser:** [`PostHogProvider.tsx`](../src/providers/PostHogProvider.tsx) calls `posthog.init()` only when `NEXT_PUBLIC_POSTHOG_KEY` is set, pointing `api_host` at `/ingest`. It wraps `src/app/(frontend)/layout.tsx`, `src/app/(embeds)/layout.tsx` and `src/app/(payload)/layout.tsx`; feature flags, surveys, product tours, conversations and exception capture are disabled, and heatmaps and dead clicks are on regardless of project settings, because the PostHog project is shared with AvyApp. Session replay and autocapture still follow the project, which code can't override. Don't swap the `advanced_disable_feature_flags` options for `advanced_disable_flags`: it also skips remote config, which stops replay. Init runs in a leaf rendered before `children` so it happens before any descendant's effect — React commits effects child-first, and `posthog.register()` before `init()` is a silent no-op.
- **Super properties:** every browser event carries `source: nwacus/web`, `environment` and, on center pages, `center` (the uppercased tenant slug), the same names AvyApp uses. `environment` comes from [`getPostHogEnvironment`](../src/utilities/getPostHogEnvironment.ts), which reads `NEXT_PUBLIC_POSTHOG_ENVIRONMENT`. It is a Vercel environment variable (Production `production`, Preview `preview`, plus a Preview override scoped to the `main` branch set to `development`, since the dev deploy builds as Preview); a dedicated variable is needed because the unprefixed `VERCEL_ENV` is server-only and `vercel build` from CI never receives Vercel's auto-exposed `NEXT_PUBLIC_VERCEL_*` copies. Events before this convention carried `platform: AvyWeb` and a lowercase `tenant` instead; insights that span both eras break down on `coalesce(properties.center, upper(properties.tenant))`. [`PostHogCenterRegister`](../src/components/PostHogCenterRegister.client.tsx) registers `center` from the `[center]` layout; the `useAnalytics` `capture` wrapper in [`useAnalytics.ts`](../src/utilities/useAnalytics.ts) only passes event-specific properties.
- **Admin identity:** [`PostHogAdminIdentity`](../src/components/PostHogAdminIdentity.client.tsx) runs `posthog.identify()` with the logged-in user's id in the admin layout, linking the browser's anonymous id to the person, registers the selected tenant as `center`, and resets on logout.
- **NAC widgets:** [`NACWidget`](../src/components/NACWidget/index.tsx) sets `posthog` on each widget's data object (`forecastWidgetData`, `obsWidgetData`, etc.) when `NEXT_PUBLIC_POSTHOG_KEY` is set, so embedded widgets reuse the host client instead of initializing a second instance and double-counting pageviews. It is a narrow handle from [`widgetPostHogClient.ts`](../src/utilities/widgetPostHogClient.ts): `capture` (which stamps `host_source`) plus read-only accessors, with no `register`/`identify`/`reset`. Widget builds before afp-public-widgets#313 ignore the key.
- **404s:** center not-found pages send a `page_not_found` event from the browser via [`TrackPageNotFound`](../src/components/TrackPageNotFound.client.tsx); see [not-found-report.md](not-found-report.md).

### Environment variables

| Variable                   | Required | Description                                                             |
| -------------------------- | -------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_POSTHOG_KEY`  | No       | PostHog project key — PostHog is disabled when absent |
| `NEXT_PUBLIC_POSTHOG_HOST` | No       | UI host for links (default `https://us.i.posthog.com`)                  |
| `NEXT_PUBLIC_POSTHOG_ENVIRONMENT` | No | `production`, `preview`, `development` or `local`; set per Vercel environment (see above), `local` when absent or unrecognized |

The PostHog variables default to empty in [`.env.example`](../.env.example), so analytics stay off until a key is provided. The server-side query credentials behind the admin Web Analytics page (`POSTHOG_QUERY_API_KEY`, `POSTHOG_PROJECT_ID`) are documented in [admin-analytics.md](admin-analytics.md).

# Dynamic Tenant Loading in Middleware

Date: 2025-07-23

Status: accepted

## Context

The existing middleware implementation used a hardcoded static array of tenant configurations. This approach had two main issues:

1. Adding or modifying tenants required code changes by a dev
2. It was possible for the hardcoded values to be different across environments or get out of sync from the database (same as problem 1.)

We need the tenants list in the middleware to be representative of the tenants in the database for that environment and not require code changes when adding or modifying tenants.

## Decision

Load the tenants list dynamically using a combination of build-time generation and a cached API route.

The implementation accomplishes this with:

1. An async `getTenants()` function that fetches from `/api/tenants/cached-public` with a 500ms timeout
2. 5-minute ISR cache at the collection endpoint level using `unstable_cache` with Next.js tags
3. Build-time static tenant data from `src/generated/tenants/static-tenants.json` as the ultimate fallback
4. Automatic cache invalidation when tenants are created or updated using Payload hooks

## Consequences

Despite the cached API route it's still possible our overall performance will take a hit. The cache times seem reasonable but we've added performance logging for all return scenarios in the middleware to keep an eye on performance.

Build time generation is a nice fallback and we could even lower the `getTenants()` timeout if we want to.

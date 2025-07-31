# Edge Config Tenant Lookup

Date: 2025-07-26

Status: accepted

Supersedes: [007-dynamic-tenants-middleware.md](./007-dynamic-tenants-middleware.md)

## Context

The previous implementation used a hybrid approach of build-time static tenant generation + cached API route. This had several issues:

1. **Edge Runtime Limitations**: Build-time generation failed in middleware because the edge runtime cannot access the filesystem to read JSON files
2. There wasn't an ideal way of using fallback tenants that wouldn't eventually become outdated.
2. The set up was overly complicated.

## Decision

Migrate to **Vercel Edge Config as the primary tenant lookup mechanism** with the cached API route as a fallback.

### Key Changes

1. **Primary Source**: Edge Config for fast, globally distributed tenant lookups
2. **Fallback**: Cached API route when Edge Config is unavailable
3. **Maintenance**: Payload collection hooks automatically update Edge Config when tenants change

## Consequences

- **Faster Lookups**: Edge Config provides sub-10ms tenant resolution globally
- **No Build Dependencies**: Eliminates filesystem access issues in edge runtime
- **Automatic Sync**: Tenant changes immediately update Edge Config via hooks


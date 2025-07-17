# Observability Tools

Date: 2025-03-18

Status: accepted

## Context

We need to be able to monitor errors and performance, view logs, and capture web analytics in production.

1. Error monitoring
2. Logs drain
3. Analytics

## Decision

Sentry and PostHog are great tools for this and we already have accounts used by [Avy](https://github.com/NWACus/avy).

Sentry:
- Error monitoring
- Performance monitoring

PostHog:
- Analytics

BetterStack:
- Logs drain

## Consequences

Sentry and PostHog will likely require adding very minimal code to wire those up. We may need to do some extra work to account for so many different domains and the fact that we'll want to split out analytics across tenants.

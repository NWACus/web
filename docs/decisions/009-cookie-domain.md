# Explicitly Setting the Cookie Domain

Date: 2025-08-18

Status: accepted

## Context

In production, we were running into permissions errors and an inability to log out. This was because the domain of the `payload-token` cookie was mismatched with the visited domain and `NEXT_PUBLIC_ROOT_DOMAIN` env var.

If a user was visiting `avy-fx.org/admin` and the `NEXT_PUBLIC_ROOT_DOMAIN` env var was set to `www.avy-fx.org/admin`, the `payload-token` cookie's domain would be set to `www.avy-fx.org` specifically which mismatches with the visited domain `avy-fx.org` (no `www.`).

This is due to [how cookie domain setting works](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies#define_where_cookies_are_sent) where if there is no domain explicitly set on a cookie, it uses the current domain and it is scoped to _only_ that domain. Setting the domain explicitly is actually _more_ permissive because it allows all subdomains of that domain. So setting a cookie's domain to `avy-fx.org` actually allows it to be used on any subdomain of `avy-fx.org`, including `www.avy-fx.org`.

Adding a redirect from the apex domain (i.e. `avy-fx.org`) to the `www` subdomain seemed logical but our url and routing utilities don't have any handling for `www` specifically which would be required because we'd need to strip off `www` before handling our subdomain redirects.

## Decision

We will add a redirect from the `www` subdomain to the apex domain (i.e. `avy-fx.org`) in our DNS and will always use apex domain urls.

We will explicitly set the `payload-token` cookie domain by configuring this in our users collection's `auth` config.

We will add a cookie prefix in the format `avy-fx-payload-${getEnvironmentFriendlyName()}` so that payload cookies will be scoped to the environment they're set in.

## Consequences

This has the side effect that `payload-token` cookies will be shared across subdomains. So if a user logs in at `avy-fx.org` and then visits `sac.avy-fx.org` they will still be logged in.

# Moving away from pure RBAC to hybrid permission model

Date: 2025-11-02

Status: accepted

## Context

Payload provides field-level access control but our RBAC system, while robust, only provides the ability to set rules for actions at the collection-level. This was fine for when our users were either tenant-scoped or global users. And we really hadn't had global users that weren't super admins (i.e. had access to perform all actions on all collections).

Prior to this decision we had a "pure" RBAC permission model where access was based on rules (action + collection) in roles which a user were associated with.

Except it's not exactly pure because we already had a few exceptions:
- Self-access patterns: Users accessing their own records
- Domain-based access: Email domain matching for user access among tenants
- Relationship-based access: Read-only access on role assignments based on the role assignment's tenant relationship

The needs of A3 (the American Avalanche Association) events functionality made us consider expanding this mostly-pure RBAC permission model.

We needed to be able to have a global user who can manage providers. We could manage most of that with pure RBAC using global roles except filtering _which_ users a "provider manager" global role would be able to see since we can still only control actions at the collection-level. But we also needed to allow external course providers to create and edit events that are not associated with a tenant and to restrict which types of events they can create.

We considered a simple approach where a newly created provider would get a unique "token" (just a random string) that they would use to access a management page. This page on the root domain would let the visitor create and edit events for that provider, for course types they're approved for. While simpler in approach, it meant recreating a lot of UI that we already get with the Payload admin panel (list view of events with filtering, create view, edit view, delete, complex blocks editor, etc.)

So why not use the Payload admin panel to save us some time dev time and support the full functionality of Payload and save some dev time.

## Decision

Introduce two new access patterns using a hybrid permission model:
- Relationship-based access via Providers collection: Users can now have relationship(s) to Providers.
- "Special" global role indicated by a field in a global: AAA Management global has a `providerManagerRole` field which is used in access utility functions to grant special access to that role

Essentially this introduces two new types of users:
1. Provider users (has relationship(s) to provider(s))
2. Provider managers (has the `providerManagerRole` global role)

This let's us:
- Have users without global roles and without tenant roles who can manage their providers and their providers' events
- Utilize the full functionality of Payload's admin panel
- Have field-level access control for "special" global roles (i.e. the provider manager in this case)

## Consequences

The argument against moving away from a pure RBAC permission model among the team was always that it introduces potential confusing as to _why_ a certain user would have access to something or not, since access is no longer only based on rules in roles.

We had already made a few exceptions that were minor and made sense based on expected UX. But this does take it significantly farther. However, these two new access patterns do have "expected" UX in that provider users have access based on their provider relationships and they can see those in the admin panel. The provider manager role is defined in a global, in the admin panel. The source of permissions is still "visible" in the admin panel.

This complicated some of our access functions but it also resolves a few hidden issues with our global roles system and is a good first foray into allowing non-tenant users in Payload. This is likely the biggest implication because it does make debugging more difficult since there are multiple mechanisms providing access.

There is also a potential performance hit here since we do look up a global often in access functions now (the `providerManagerRole` field on `aaaManagement`) but likely not significant due to caching.

## Potential alternatives

These all have similar trade offs but are worth mentioning:

1. If we were willing to have two separate collections for tenant events and provider events, we could potentially simplify some of the access function and conditional logic in the events collection. _Just_ using global roles wouldn't work here since we still need to scope what a given provider user can do based on their provider and what course types they are allowed to create.
2. It is possible to have more than one auth-enabled collection in Payload. We could make the providers collection auth-enabled and have a single login per provider. This might be worth exploring further.

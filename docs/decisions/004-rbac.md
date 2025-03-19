# Approach to Role-Based Access Control (RBAC)

Date: 2025-03-18

Status: proposed

## Context

Payload provides a very flexible approach to [access control](https://payloadcms.com/docs/access-control/overview). But we still need to design and implement RBAC based on our needs ourselves.

Their multi-tenant plugin helps with access related to multi-tenancy but we still need to implement our custom RBAC requirements.

We want:
- Super admin role: can see all content regardless of tenant
- Flexible tenant-scoped roles: can perform any of create, read, update, delete, * on any of the collections
- Users can have many roles

We may want:
- Users to be able to have roles across multiple tenants
- Users to be able to have roles that only allow them to authenticate outside of the payload admin panel on a tenant's subdomain.
  - Users would be able to have a single account across tenants

## Decision

A flexible approach using three collections and a rules field has been built to allow for:
- Global roles
- Tenant-scoped roles
- Global roles and tenant-scoped roles can be managed with custom rules by super admins
- Tenant-scoped roles can be managed by tenant admins

Tenant scoped roles are applied in this order (in the context of performing an action on a collection):
1. Filter by tenant based on the tenant field on the collection
2. Filter by rules associated with the role based on the collection and action

Global access is checked before tenant-scoped role assignments so that it will supercede tenant-scoped role assignments.

Collections:
- roles (both global and tenant-scoped roles)
- roleAssignments (tenant-scoped role assignments)
- globalRoleAssignments

Additional benefits to this approach:
- Roles and bindings are just CMS content, so AC staff / our users can reconfigure these at their discretion and on their own time. There may be technical consulting required but not dev work to add/change/remove roles.
- Per-tenant admins can manage their own fiefdom however they want, so there's no central bottleneck for user management

## Consequences

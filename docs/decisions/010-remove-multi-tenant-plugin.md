# Removal of Multi Tenant Plugin dependency

Date: 2025-10-06

Status: accepted

## Context
> [!IMPORTANT]
> We chose to discontinue using Payload's multi-tenancy plugin—which provides convenient management of multiple tenants directly within the admin panel—and instead migrated to local implementations of the v3.48.0 components we had been utilizing.

## Reasons for this change:

- Our RBAC implementation doesn't align with how Payload's multi-tenancy plugin was intended to be used (see see [RBAC decision doc](./decisions/004-rbac.md) for details)
- The plugin updates after version 3.48.0 were blocking us, preventing us from upgrading Payload. Moving to local components removes this dependency.

## Implementation notes:

We've imported everything in into our codebase from the plugin's source code. We also wrote our own custom `TenantSelector` rather than importing it directly from the source code

- [Source code](https://github.com/payloadcms/payload/tree/v3.48.0/packages/plugin-multi-tenant)
- [Plugin documentation](https://payloadcms.com/docs/plugins/multi-tenant)
- [Pull request](https://github.com/NWACus/web/pull/570)
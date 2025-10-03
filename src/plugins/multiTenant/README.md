# Multi Tenant Plugin v3.48.0

> [!IMPORTANT]
> We decided to move away from Payloads multi-tenancy plugin, which easily manage multiple tenants from within your admin panel, and migrate the components we were using locally.

### Reasons for this change:

- Our RBAC implementation doesn't align with how Payload's multi-tenancy plugin was intended to be used (see see [RBAC decision doc](../../../docs/decisions/004-rbac.md) for details)
- The plugin was blocking us at version 3.48.0, preventing Payload upgrades. Moving to local components removes this dependency.

### Implementation notes:

We've imported everything in `plugins/multi-tenant` into our codebase from the plugin's source code. We also wrote our own custom `TenantSelector` rather than importing it directly from the source code

- [Source code](https://github.com/payloadcms/payload/tree/v3.48.0/packages/plugin-multi-tenant)
- [Plugin documentation](https://payloadcms.com/docs/plugins/multi-tenant)

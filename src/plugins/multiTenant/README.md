# Multi Tenant Plugin v3.48.0

> [!IMPORTANT]
> We decided to move away from Payloads multi-tenancy plugin and move the components we use locally. We did this because:
>
> - we are not using the way payload intended users to (see [RBAC decision doc](../../../docs/decisions/004-rbac.md))
> - we want to be able to update Payload whenever we want
>
> We also wrote our own custom `TenantSelector` rather than importing it directly from the source code

This plugin from [Payload v3.48.0](https://github.com/payloadcms/payload/tree/v3.48.0) to easily manage multiple tenants from within your admin panel.

- [Source code](https://github.com/payloadcms/payload/tree/v3.48.0/packages/plugin-multi-tenant)
- [Plugin documentation](https://payloadcms.com/docs/plugins/multi-tenant)

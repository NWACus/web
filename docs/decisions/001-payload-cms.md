# Payload CMS

Date: 2025-03-18

Status: accepted

## Context

There are many popular headless CMS options out there. We need one that supports multi tenancy. We want one that uses modern technology that will make development easy and allow us to accomplish project goals within budget. So we can't spend a fortune hosting multiple instances.

## Decision

The choice to use PayloadCMS comes down to:
- Multi tenancy support. They specifically call out multi tenancy in their [marketing](https://payloadcms.com/multi-tenancy) and built a [multi-tenant plugin](https://github.com/payloadcms/payload/pull/10447) with our feedback.
- It's just Next.js. We can deploy to Vercel and not have to deploy and pay an expensive pricing plan for an instance for each avalanche center (like we would with something like Sanity)

## Consequences

We're starting out with the [website template](https://github.com/payloadcms/payload/tree/main/templates/website) and building multi tenancy in with custom RBAC.

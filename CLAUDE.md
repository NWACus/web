# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm dev:prod` - Clean build and start production server locally

### Database & Seeding

- `pnpm bootstrap` - Quick setup: creates DB with bootstrap@avy.com user and super-admin rights
- `pnpm seed` - Full database seed with all test data
- `pnpm reseed` - Incremental update of changed seed data
- `pnpm migrate` - Run Payload migrations

### Testing & Quality

- `pnpm test` - Run all tests (client and server environments)
- `pnpm test:watch` - Run tests in watch mode
- `pnpm lint` - Run Next.js linter
- `pnpm eslint` - Run ESLint directly
- `pnpm tsc` - TypeScript type checking
- `pnpm prettify` - Format code with Prettier

### Email Development

- `pnpm email:dev` - Start React Email preview server on port 3001

### Type Generation

- `pnpm generate:types` - Generate Payload types
- `pnpm generate:importmap` - Generate Payload import map

## Architecture Overview

### Multi-Tenant System

The application serves multiple avalanche centers from a single codebase using dynamic tenant resolution:

**Tenant Resolution Flow:**

1. **Middleware** (`src/middleware.ts`) intercepts requests
2. **Edge Config Lookup** - Primary method using Vercel Edge Config for fast global lookups
3. **Cached API Fallback** - Falls back to `/api/tenants/cached-public` with 5-minute cache
4. **Request Rewriting** - Rewrites URLs to inject tenant context

**Tenant Data Sources:**

- Production: Vercel Edge Config stores (`avy-edge-config-prod`, `avy-edge-config-preview`)
- Local: Uses preview Edge Config or cached API route
- Automatic sync via Payload hooks when tenants are modified

### PayloadCMS Structure

**Core Collections:**

- `Tenants` - Avalanche center configurations with custom domains
- `Users` - Multi-tenant user management with domain scoping
- `Pages/Posts` - Content with tenant field scoping
- `Roles/RoleAssignments` - Tenant-scoped RBAC system
- `GlobalRoles/GlobalRoleAssignments` - Cross-tenant permissions
- `Media` - File uploads with tenant prefixing
- `Navigations` - Tenant-specific navigation structures

**Content Blocks System:**
All content uses a flexible blocks architecture in `src/blocks/`:

- `Content`, `ContentWithCallout`, `ImageText`, `ImageTextList`
- `MediaBlock`, `Form`, `Biography`, `Team`
- Each block has `Component.tsx` and `config.ts`

### RBAC (Role-Based Access Control)

**Two-Level Permission System:**

- **Global Roles** - Super admin, cross-tenant access
- **Tenant Roles** - Scoped to specific avalanche centers
- **Access Functions** - `src/access/` contains reusable access patterns
- **Escalation Protection** - Prevents users from granting roles above their level

### NAC Widget Integration

External widget system for avalanche forecasts:

- `NACWidget` component handles widget rendering
- `NACWidgetsConfig` global for widget configuration
- CSS integration via `nac-widgets.css`

## Key Development Patterns

### Tenant Field Plugin

- Automatic tenant field injection on relevant collections
- Filters content by tenant context in admin and frontend
- Located in `src/plugins/tenantFieldPlugin/`

### Slug Generation

- Custom slug field with uniqueness validation per tenant
- Auto-generation with conflict resolution
- Component: `src/fields/slug/SlugComponent.tsx`

### Content Hash Fields

- Automatic content fingerprinting for cache invalidation
- Used for revalidating static pages when content changes

### Email System

- **Development**: Nodemailer with Mailtrap.io sandbox
- **Production**: Resend integration
- **Templates**: React Email components in `src/emails/`
- **Custom Function**: Use `src/utilities/email/sendEmail.ts` for consistent reply-to handling

## Testing Architecture

**Dual Environment Setup** (Jest config in `jest.config.mjs`):

- **Client Tests** - `__tests__/client/` using jsdom environment
- **Server Tests** - `__tests__/server/` using node environment

Test specific environments:

- Client: React components, utilities, client-side logic
- Server: API routes, server utilities, database operations

## Development Environment

### Local Database

- SQLite with WAL mode for local development
- Seed data includes multiple avalanche centers (NWAC, DVAC, SAC, SNFAC)
- Database file: `dev.db` (with .shm and .wal files)

### Multi-Root Workspace

This is part of a multi-root workspace:

- `/web/` - Main application (this directory)
- `/payload/` - PayloadCMS source for reference only
- **Rule**: Only modify main application code, reference PayloadCMS for understanding

### PostHog Integration Guidelines

- Never hallucinate API keys - use environment variables
- Feature flags should be used minimally and descriptively
- Use enums/const objects for flag names (UPPERCASE_WITH_UNDERSCORE)
- Gate flag-dependent code with validation checks
- Maintain naming consistency for events and properties

### Local Development Setup

**Localhost Subdomains** (add to `/etc/hosts`):

```
127.0.0.1       dvac.localhost
127.0.0.1       nwac.localhost
127.0.0.1       sac.localhost
127.0.0.1       snfac.localhost
```

**Admin Access**: `localhost:3000/admin`

- Bootstrap user: `bootstrap@avy.com` / `password`
- Seeded users available with various role assignments

## Production Considerations

### Environment Flags

Local flags for debugging and production builds:

- `LOCAL_FLAG_ENABLE_LOCAL_PRODUCTION_BUILDS=true` - Enables local prod builds
- `LOCAL_FLAG_ENABLE_FULL_URL_LOGGING=true` - Enhanced logging
- See `.env.example` for complete list

### Caching Strategy

- **ISR** - Incremental Static Regeneration for pages/posts
- **Edge Config** - Fast tenant lookups globally
- **Cached API Routes** - 5-minute cache with Next.js `unstable_cache`
- **Revalidation Hooks** - Automatic cache invalidation on content changes

### Monitoring

- **Sentry** - Error tracking and performance monitoring
- **PostHog** - Analytics and feature flags
- **Vercel Analytics** - Web vitals and performance metrics

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## LLM Documentation References

When working with frameworks in this project, reference the official LLM documentation:

- **Next.js**: https://nextjs.org/docs/llms-full.txt
- **Payload CMS**: No official llms.txt yet (requested in [issue #13362](https://github.com/payloadcms/payload/issues/13362))

## Essential Commands

### Development

- `pnpm dev` - Start development server with debugging enabled
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm dev:prod` - Clean build and start production server locally

### Database & Seeding

- `pnpm bootstrap` - Quick setup: creates DB with bootstrap@avy.com user and super-admin rights
- `pnpm seed` - Full database seed with all test data (uses shell script)
- `pnpm seed:standalone` - Faster standalone seed with all test data (recommended)
- `pnpm reseed` - Incremental update of changed seed data
- `pnpm migrate` - Run Payload migrations
- `pnpm migrate:check [filename]` - Check migrations for potentially destructive patterns
- `pnpm migrate:diff` - Analyze differences between migration JSON snapshots

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

### Tech Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **CMS**: PayloadCMS 3.68.3
- **Database**: SQLite locally (WAL mode), Turso (libSQL) in production
- **Storage**: Vercel Blob
- **Styling**: Tailwind CSS with Radix UI components
- **Email**: Resend (production), Nodemailer/Mailtrap (development)
- **Monitoring**: Sentry, PostHog, Vercel Analytics

### Project Structure

```
src/
├── app/          # Next.js App Router routes and API endpoints
├── collections/  # 27 PayloadCMS collections
├── blocks/       # 27+ content block components
├── components/   # React components (admin and frontend)
├── fields/       # Custom field configurations
├── access/       # RBAC access control functions
├── utilities/    # Utility functions organized by domain
├── globals/      # Global Payload CMS configurations
├── plugins/      # Custom Payload plugins
├── services/     # External service integrations
├── emails/       # React Email templates
├── migrations/   # Database migrations (90+ files)
docs/             # Architecture decisions and guides
__tests__/        # Jest tests (client and server)
```

### Multi-Tenant System

The application serves multiple avalanche centers from a single codebase using dynamic tenant resolution:

1. **Middleware** (`src/middleware.ts`) intercepts requests
2. **Edge Config Lookup** - Primary method using Vercel Edge Config for fast global lookups
3. **Cached API Fallback** - Falls back to `/api/tenants/cached-public` with 5-minute cache
4. **Request Rewriting** - Rewrites URLs to inject tenant context

### RBAC (Role-Based Access Control)

Two-level permission system:

- **Global Roles** - Super admin, cross-tenant access
- **Tenant Roles** - Scoped to specific avalanche centers
- **Access Functions** - `src/access/` contains reusable access patterns
- **Escalation Protection** - Prevents users from granting roles above their level

**Key RBAC utilities:**

- `src/access/byTenantRole.ts` - Main access function (checks BOTH global and tenant roles)
- `src/access/byTenantRoleOrReadPublished.ts` - Allows public read of published content
- `src/utilities/rbac/ruleMatches.ts` - Core rule matcher with wildcard support
- `src/utilities/rbac/hasGlobalOrTenantRolePermission.ts` - Synchronous permission check for admin UI

**Important patterns:**

- Global roles are checked first and bypass tenant restrictions if matched
- Role data is saved to JWT (`saveToJWT: true`) for synchronous access checks
- Escalation checks only apply to REST API calls (Local API bypasses them for seeding)
- Rules use wildcards: `{collections: ['*'], actions: ['*']}` = super admin
- Tenant context comes from cookie via `getTenantFromCookie()`

## Key Documentation

Read these docs for detailed guidance on specific topics:

- **`/docs/coding-guide.md`** - Coding patterns and conventions (TypeScript, relationships, error handling, blocks)
- **`/docs/revalidation.md`** - ISR and cache invalidation strategy
- **`/docs/migration-safety.md`** - Automated checks for destructive migrations
- **`/docs/onboarding.md`** - Checklist for new tenant setup
- **`/docs/decisions/`** - Architectural decision records

## Development Environment

### Local Database

- SQLite with WAL mode for local development
- Seed data includes multiple avalanche centers (NWAC, DVAC, SAC, SNFAC)
- Database file: `dev.db` (with .shm and .wal files)

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

### Environment Flags

See `.env.example` for all available flags. Key ones:

- `LOCAL_FLAG_ENABLE_LOCAL_PRODUCTION_BUILDS=true` - Enables local prod builds
- `LOCAL_FLAG_ENABLE_FULL_URL_LOGGING=true` - Enhanced logging
- `ENABLE_LOCAL_MIGRATIONS=true` - Enable migration mode for testing

## Testing Architecture

**Dual Environment Setup** (Jest config in `jest.config.mjs`):

- **Client Tests** - `__tests__/client/` using jsdom environment
- **Server Tests** - `__tests__/server/` using node environment

---

## Coding Rules

### Style Preferences

- Only add code comments when necessary - i.e. the code is not easy to understand and needs more thorough explanation
- Always add a code comment for regex expressions or string replacements
- Only use TypeScript casting when absolutely necessary. Prefer using correct types and type guards (see `/docs/coding-guide.md`)
- Prefer Payload's logger over `console.log`
- Prefer Tailwind utility classes over adding `.css` or `.scss` files
- Use the `cn()` utility for conditional class names

### Relationship Fields

Always use the relationship helper utilities from `src/utilities/relationships.ts`:

```typescript
import {
  isValidRelationship,
  filterValidRelationships,
  isValidPublishedRelationship,
  filterValidPublishedRelationships,
} from '@/utilities/relationships'
```

Never cast relationship fields - they can be resolved objects, unresolved IDs, or null/undefined.

### When Modifying Collection Schemas

1. **Check if seed data needs updating** - If you add/change fields, update the seed script to include appropriate test data
2. **Run the seed script** - After updating, run `pnpm seed:standalone` to verify it completes without errors
3. **Generate a migration** - Run `pnpm payload migrate:create` for schema changes
4. **Check migration safety** - Run `pnpm migrate:check` to detect potentially destructive patterns
5. **Review `/docs/migration-safety.md`** for guidance on safe migrations

### When Adding New Collections/Globals

1. **Consider revalidation** - Reference `/docs/revalidation.md` to determine if revalidation hooks are needed
2. **Add seed data** - Add seed data to the seed script when the schema is finished
3. **Run the seed script** - Verify `pnpm seed:standalone` completes without errors
4. **Generate a migration** - Run `pnpm payload migrate:create`
5. **Update type generation** - Run `pnpm generate:types` after schema changes

### When Adding New Blocks

1. Follow the naming conventions in `/docs/coding-guide.md` (e.g., `SingleButtonBlock`, `singleButton` slug)
2. Add new blocks to:
   - `src/blocks/RenderBlocks.tsx`
   - `src/components/RichText/index.tsx` (if there's a Lexical variation)
   - At least one `blocks` type field or `richText` `BlocksFeature` so Payload generates types

### Error Handling

Components should degrade gracefully when data is missing:

```typescript
// Return null instead of crashing
if (!document || !isValidRelationship(document)) {
  return null
}
```

### Testing Requirements

- Include tests with PRs when possible
- Client tests go in `__tests__/client/` (jsdom environment)
- Server tests go in `__tests__/server/` (node environment)

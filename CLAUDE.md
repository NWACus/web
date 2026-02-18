# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## LLM Documentation References

When working with frameworks in this project, reference the official LLM documentation:

- **Next.js**: https://nextjs.org/docs/llms-full.txt
- **Payload CMS**: No official llms.txt yet (requested in [issue #13362](https://github.com/payloadcms/payload/issues/13362))

### Payload CMS Source Reference

When you need to understand Payload internals, reference the source code in `node_modules`:

- **Core Payload**: `node_modules/payload/dist/` - Collections, fields, access control, operations
- **Admin UI**: `node_modules/@payloadcms/ui/dist/` - React components, forms, views
- **Next.js Integration**: `node_modules/@payloadcms/next/dist/` - Routes, handlers, middleware
- **Lexical Rich Text**: `node_modules/@payloadcms/richtext-lexical/dist/` - Editor, features, nodes
- **SQLite Adapter**: `node_modules/@payloadcms/db-sqlite/dist/` - Database operations

The code is readable ES modules with source maps. This matches the exact Payload version used in this project.

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

## Payload Security Patterns

These patterns are critical for secure Payload development. Violations can cause security vulnerabilities or data corruption.

### 1. Local API Access Control (MOST IMPORTANT)

```typescript
// ❌ SECURITY BUG: Access control bypassed - user param is ignored!
await payload.find({
  collection: 'posts',
  user: someUser, // This does nothing! Operation runs with ADMIN privileges
})

// ✅ SECURE: Enforces user permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false, // REQUIRED when passing user
})

// ✅ Administrative operation (intentional bypass, no user)
await payload.find({
  collection: 'posts',
  // No user = admin operation, overrideAccess defaults to true
})
```

**Rule**: When passing `user` to Local API, ALWAYS set `overrideAccess: false`

### 2. Transaction Safety in Hooks

```typescript
// ❌ DATA CORRUPTION RISK: Runs in separate transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        // Missing req = separate transaction, can cause orphaned data
      })
    },
  ],
}

// ✅ ATOMIC: Same transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req, // Maintains atomicity - if parent fails, this rolls back too
      })
    },
  ],
}
```

**Rule**: ALWAYS pass `req` to nested Payload operations in hooks

### 3. Prevent Infinite Hook Loops

```typescript
// ❌ INFINITE LOOP: update triggers afterChange which updates again
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        req,
      }) // Triggers afterChange again forever!
    },
  ],
}

// ✅ SAFE: Use context flag to break the loop
hooks: {
  afterChange: [
    async ({ doc, req, context }) => {
      if (context.skipViewCount) return

      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        req,
        context: { skipViewCount: true },
      })
    },
  ],
}
```

### 4. Field-Level vs Collection-Level Access

```typescript
// Collection-level access CAN return query constraints (row-level security)
const collectionAccess: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  return { author: { equals: user.id } } // Query constraint OK here
}

// ❌ Field-level access can ONLY return boolean
{
  name: 'salary',
  type: 'number',
  access: {
    read: ({ req: { user } }) => {
      return { department: { equals: user.department } } // WRONG! Will error
    },
  },
}

// ✅ Field-level access - boolean only
{
  name: 'salary',
  type: 'number',
  access: {
    read: ({ req: { user }, doc }) => {
      return user?.id === doc?.id || user?.roles?.includes('admin')
    },
  },
}
```

---

## Coding Rules

### Style Preferences

- Only add code comments when necessary - i.e. the code is not easy to understand and needs more thorough explanation
- Always add a code comment for regex expressions or string replacements
- Never use TypeScript type assertions / casting like `const someVar = val as SomeType`. Write code so that TypeScript can infer the correct type. Type guards can be helpful when you might otherwise use a type assertion.
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

---

## Working on GitHub Issues

When triggered via GitHub Issues (with `@claude` mention):

### Before Making Changes

1. Read the full issue description and any linked context
2. Identify which files need to be modified
3. Understand existing patterns in nearby code

### Making Changes

1. Create a new branch from `main` with a descriptive name
2. Make focused changes that address the issue requirements
3. Follow existing code patterns and styles in the codebase
4. Run `pnpm prettify`, `pnpm tsc`, and `pnpm lint` before committing

### Pull Request Descriptions

When asked to write a PR description, follow the template in `.github/PULL_REQUEST_TEMPLATE.md` and return the description in markdown.

### Creating the PR

1. Write a clear PR title summarizing the change
2. Follow the PR description template in .github/PULL_REQUEST_TEMPLATE.md
3. Reference the issue number (e.g., "Fixes #123")
4. Describe what was changed and why
5. Note any decisions made or alternatives considered

### Quality Checklist

Before marking work complete, verify:

- [ ] Changes address all requirements in the issue
- [ ] Code follows existing patterns in the codebase
- [ ] No TypeScript errors (`pnpm tsc`)
- [ ] No lint errors (`pnpm lint`)
- [ ] Tests pass if applicable (`pnpm test`)
- [ ] No unrelated changes included

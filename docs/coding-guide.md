# Coding Guide

This guide documents coding patterns and conventions for `nwacus/web` (AvyWeb). It's designed to help both team members and future open source contributors write consistent, safe code.

This document should be updated periodically as we agree on additional patterns/practices.

Review our decision docs to understand the context of important architectural decisions for this repo: `/docs/decisions`

## Logging

Prefer Payload's logger over console.log.

```typescript
if (typeof biography !== 'object') {
  payload.logger.error(
    `BiographyBlock got an unresolved biography reference: ${JSON.stringify(biography)}`
  )
  return null
}
```

## TypeScript

### Avoid Casting

Only use TypeScript casting when absolutely necessary. Prefer using correct types and type guards:

```typescript
// ❌ - Casting masks potential runtime errors
const sponsors = (props.sponsors as Sponsor[]).map(...)

// ✅ - Type guard ensures runtime safety
const sponsors = filterValidRelationships(props.sponsors).map(...)
```

### Type Guards

Use type guards like `isValidRelationship()` or `invariant()` instead of manual type checks. They provide both runtime safety and TypeScript type narrowing.

## Code Comments

- Comments explaining hard-to-understand code are encouraged but if the code is easily understood on it's own, please omit unnecessary comments.
- Always leave a comment for RegEx expressions

## Testing

Our testing is lightweight at the moment. Including tests with PRs is always encouraged. We would like to build out a more thorough testing suite as this repo matures.

## Adding New Collections

When adding new collections please make sure to review the following docs:
- `/docs/revalidation.md` -- If the collection is referenced as a relationship in a block, you need to write revalidation hooks
- `/docs/migration-safety.md` -- You need to generate a migration. Make sure your migration will not result in unintended data loss.

## Safely handling relationship fields

Relationship fields in Payload can be in three states:
- **Resolved object** (when populated) - `{ id: '123', name: 'Example', ... }`
- **Unresolved ID** (when not populated) - `123`
- **Deleted reference** (when related document was deleted or during live preview) - `null` or `undefined`

If you don't handle all three cases, your code can break when a related document gets deleted or during live preview.

### Solution

Use the relationship helper utilities from `src/utilities/relationships.ts`:

```typescript
import {
  isValidRelationship,
  filterValidRelationships,
  isValidPublishedRelationship,
  filterValidPublishedRelationships
} from '@/utilities/relationships'
```

**Examples:**

Single relationships:
```typescript
export const FormBlock = (props: FormBlockProps) => {
  if (!isValidRelationship(props.form)) return null
  return <div>{props.form.fields.map(...)}</div>
}
```

Array relationships:
```typescript
export const SponsorsBlock = ({ sponsors }: Props) => {
  const validSponsors = filterValidRelationships(sponsors)
  return validSponsors.map(sponsor => <Sponsor data={sponsor} />)
}
```

Draft-enabled collections:
```typescript
const publishedPosts = filterValidPublishedRelationships(relatedPosts)
```

Combine with additional filters:
```typescript
filterValidRelationships(sponsors).filter(s => !s.endDate || new Date(s.endDate) >= now)
```

## Error Handling

### Graceful Degradation

Components should degrade gracefully when data is missing:

```typescript
// ✅ - Returns null instead of crashing
if (!document || !isValidRelationship(document)) {
  return null
}
```

**What happens when a component returns `null`?**

React natively handles `null` returns - the component simply renders nothing in the DOM without throwing an error. This allows the rest of the page to render normally even when individual components encounter missing data.

**When to use error boundaries instead:**

You typically don't need error boundaries for missing data - returning `null` is sufficient. However, you could add error boundaries when:
- You have complex nested component trees where you want to isolate failures
- You need to show a fallback UI instead of nothing (e.g., "Content unavailable") -- although you can usually just use conditionals for this instead of an error boundary.
- You want to capture unexpected runtime errors (not just missing data)

We have `ErrorBoundary` components available at `/src/components/ErrorBoundary/` for these cases. Next.js also provides `error.tsx` and `global-error.tsx` for route-level error handling.

## Styling

Prefer using Tailwind utility classes over adding `.(s)css` files.

Use the `cn()` utility for conditional class names.

## Naming and Folder Structure

### Blocks

Follow this example when creating new blocks:
| | |
|---|---|
| Block folder name | `SingleButtonBlock` |
| Block slug | `singleButton` |
| Block config name | `SingleButtonBlock` |
| Associated UI component(s) for the block | `SingleButtonComponent` |
| Config with `wrapInContainer` | `SingleBlogPostBlockLexical` |

If a block is going to be allowed to be embedded in a `blocks` type field and in a `richText` Lexical `BlocksFeature` than you will typically want to use the `____Block` + `____BlockLexical` naming. This is to allow having slightly different configs where the Lexical variation will allow the user to change the `wrapInContainer` field on the block whereas the `blocks` type field variation will default to true since it should always be wrapped in a container as a full page width section.

See `src/blocks/GenericEmbed/config.ts` for a simple example of this.

Don't forget to add new blocks to:
- `src/blocks/RenderBlocks.tsx`
- `src/components/RichText/index.tsx` (if there is a Lexical variation of the block)
- At least one `blocks` type field or `richText` `BlocksFeature` so Payload will generate types for the block

Simple
```md
blocks
├── SingleButton
│   ├── Component.ts
    └── config.ts
```

Complex
  i.e. has multiple components, has hooks, or has custom access functions, fields that make sense to be in their own file, etc.
```md
blocks
├── SingleButton
│   ├── access
│   │   └── ...
│   ├── components
│   │   └── ...
│   └── hooks
│   │   └── ...
    └── config.ts
```


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




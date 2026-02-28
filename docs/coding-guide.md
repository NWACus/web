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
- **Deleted reference** (when related document was deleted) - `null` or `undefined`

If you don't handle all three cases, your code can break when a related document gets deleted.

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

## Blocks

### Naming and Folder Structure

Follow this example when creating new block `SingleButton`:
| | |
|---|---|
| Block folder name | `SingleButton` |
| Block config name | `SingleButtonBlock` |
| Block slug | `singleButton` |
| Block interface name | `SingleButtonBlock` |
| Associated UI component(s) for the block | `SingleButtonBlockComponent` |
| Config with `wrapInContainer` | `SingleBlogPostLexicalBlock` |


> [!NOTE]
> If a block is going to be allowed to be embedded in a `blocks` type field and in a `richText` Lexical `BlocksFeature` than you will typically want to use the `____Block` + `____LexicalBlock` naming. This is to allow having slightly different configs. See `Header` config

**Simple**
```md
blocks
├── SingleButton
│   ├── Component.ts
    └── config.ts
```

**Complex**

  i.e. has multiple components, has hooks, or has custom access functions, fields that make sense to be in their own file, etc.
```md
blocks
├── SingleButton
│   ├── access
│   │   └── ...
│   ├── components
│   │   ├── index.ts
│   │   └── ...
│   └── hooks
│   │   └── ...
    └── config.ts
```

### Adding New Blocks Checklist

When creating a new block, you must register it in the following locations:

1. **`src/blocks/RenderBlocks.tsx`** - For standalone page blocks
   - Set `isLayoutBlock={false}`

2. **`src/components/RichText/index.tsx`** - For blocks used inline within rich text editors
   - Set `isLayoutBlock={true}` to avoid double-wrapping
   - Only add blocks that should be available in Lexical editors

3. **`src/constants/defaults.ts`** - Add the block to the defaults configuration

4. **Type Generation** - automatically done but be sure to include the block in at least one of these:
   - A field with `type: 'blocks'`
   - A `richText` field's `BlocksFeature` configuration
   - This ensures Payload generates TypeScript types for your block

**Why the different `isLayoutBlock` values?**
- Standalone blocks (`RenderBlocks.tsx`) are not rendered by a Lexical editor → `isLayoutBlock={false}`
- Inline Lexical blocks (`RichText/index.tsx`) are rendered inside a Lexical editor → `isLayoutBlock={true}`


### BackgroundColorWrapper

A reusable layout component that wraps content with configurable background colors and container styles. Use this component to maintain consistent spacing and background color application across blocks.

**Props:**
- `backgroundColor` - Tailwind background color class name
- `isLayoutBlock` - Whether the block is rendered within a Lexical editor (`default: false`)
- `containerClassName` - Optional - additional classes for the inner container div
- `outerClassName` - Optional - additional classes for the outer wrapper div

**Usage:**
```tsx
<BackgroundColorWrapper
  backgroundColor={backgroundColor} // Intended for prop from colorPickerField prop
  isLayoutBlock={isLayoutBlock} // Intended for prop from standalone or lexical block declaration
  containerClassName="py-8"
>
  <YourContent />
  ...
</BackgroundColorWrapper>
```

Use this instead of manually creating nested divs with background colors and container classes to ensure consistency across block components.

Not using `BackgroundColorWrapper`
- `DocumentComponent`
- `HeaderComponent`


## Theme Preview

A dev-only page at `/{center}/theme-preview` that renders all UI components and semantic colors for a given tenant. Use this to visually verify theme changes across tenants.

- **Not available in production** — gated by `disallowedEnvironments`
- **Location:** `src/app/(frontend)/[center]/theme-preview/page.tsx`

When adding a new shadcn UI component to `src/components/ui/`, add a demo section to the theme preview page to test styling across all tenant themes.

## ButtonLink
Links styled as buttons with built-in analytics tracking. Supports both direct URLs and CMS-driven references.

**Key features:**
- Works with both simple `href` prop and CMS references (pages, posts, built-in pages)
- Automatically resolves internal/external URLs from CMS data
- Built-in Posthog analytics with `button_click` event tracking
- Intended for blocks, rich text editors, or any CMS-driven navigation
- Supports all Button styling options

**Props:**
- `href` - Direct URL (use this OR reference - not both)
- `reference` - CMS reference object (use this OR href - not both)
- `type` - `'internal'` or `'external'` (required if using `reference`)
- `label` - Button text (falls back to reference title or children)
- `newTab` - Opens in new tab
- `url` - CMS custom URL option

**Style props**
- Size: (`sm`, `default`, `lg`, `icon`, `clear`)
- Variants: (`default`, `secondary`, `ghost`, `outline`, `callout`)

**Examples:**
```tsx
// Simple link with direct href
<ButtonLink href="/about" variant="default">
  Learn More
</ButtonLink>

// External link in new tab and external link icon
<ButtonLink href="https://nwac.us" newTab>
  Visit NWAC
  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
</ButtonLink>

// CMS-driven link (internal page reference)
<ButtonLink
  reference={{ relationTo: 'pages', value: pageData }}
  variant="outline"
  size="lg"
>
  Read More
</ButtonLink>
```

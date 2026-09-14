# ADR Format

ADRs live in `docs/decisions/` and use sequential 3-digit numbering: `001-slug.md`, `002-slug.md`, etc.

## Template (house style)

This repo's ADRs follow a fuller, consistent template. Match it:

```md
# {Short title of the decision}

Date: {YYYY-MM-DD}

Status: {accepted | proposed | deprecated | superseded by [NNN-slug.md](./NNN-slug.md)}

## Context

{What forces are at play? What problem or constraint prompted this decision?}

## Decision

{What did we decide to do? State it plainly. Sub-sections / "Key Changes" are fine.}

## Consequences

{What follows from this — the trade-offs, the things future engineers should not "fix," downstream effects.}
```

Keep each section tight, but don't drop them — consistency with the existing `docs/decisions/` set matters more than brevity here. When a decision supersedes or is superseded by another, cross-link both with a `Supersedes:` / `Status: superseded by` line (see existing ADRs for examples).

## Numbering

Scan `docs/decisions/` for the highest existing number and increment by one. (Note: a couple of historical numbers may be duplicated, e.g. two `007-` files — go by the highest number present, not the count.)

## When to offer an ADR

All three of these must be true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it — you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."

### What qualifies

- **Architectural shape.** "We're using a monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library — just the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "We're using manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "We can't use AWS because of compliance requirements." "Response times must be under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If you considered GraphQL and picked REST for subtle reasons, record it — otherwise someone will suggest GraphQL again in six months.

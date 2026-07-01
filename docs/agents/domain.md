# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`DOMAIN_CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists — it points at one `DOMAIN_CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/decisions/`** — read ADRs that touch the area you're about to work in. In multi-context repos, also check `src/<context>/docs/decisions/` for context-scoped decisions.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The producer skill (`/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## File structure

This repo is **single-context**: one `DOMAIN_CONTEXT.md` plus `docs/decisions/` at the repo root.

```
/
├── DOMAIN_CONTEXT.md        ← created lazily by /grill-with-docs
├── docs/decisions/          ← ADRs already live here (000-template.md, 001-…, …)
│   ├── 001-payload-cms.md
│   └── 002-sqlite-turso.md
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `DOMAIN_CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/grill-with-docs`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-004 (RBAC) — but worth reopening because…_

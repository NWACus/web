# Skill customizations

A small set of engineering skills under `.agents/skills/` (with `.claude/skills/` symlinks) are vendored from [mattpocock/skills](https://github.com/mattpocock/skills) and tracked in `skills-lock.json`. A few vendored files are patched to match this repo's conventions. `npx skills update` (or re-adding a skill) overwrites those patches, so re-apply the steps below afterwards and commit the result.

## Vendored set

The repo vendors only the issue-tracking, grilling and prototype skills from mattpocock/skills (plus the skills they reference):

- `setup-matt-pocock-skills`, `triage`, `to-spec`, `to-tickets` (issue tracking)
- `grilling`, `grill-me`, `grill-with-docs`, `domain-modeling` (grilling and the glossary/ADR producer they hand off to)
- `prototype`

The rest of the mattpocock/skills set (`tdd`, `diagnosing-bugs`, `code-review`, `improve-codebase-architecture`, `pr`, `research`, etc.) is installed globally by the owner (`~/.agents/skills`) and is intentionally not vendored here. Non-mattpocock skills (`payload` from payloadcms/skills, and the repo-local `draft-release-notes`) are unaffected by this split.

To re-install or update the vendored set, from the repo root:

```sh
npx skills@latest add mattpocock/skills -s setup-matt-pocock-skills triage to-spec to-tickets grilling grill-me grill-with-docs domain-modeling prototype -a claude-code codex -y
```

Then re-apply the patches below.

The domain glossary rename is no longer a patch: upstream already uses `GLOSSARY.md` (and `GLOSSARY-MAP.md`), which is what this repo uses.

## 1. ADR path: `docs/adr/` -> `docs/decisions/`

Upstream puts ADRs in `docs/adr/`; this repo keeps them in `docs/decisions/`. From the repo root:

```sh
cd .agents/skills && sed -i '' -E 's#(docs/)?adr/( {6})( *←)#\1decisions/\3#; s#docs/adr/#docs/decisions/#g; s#└── adr/$#└── decisions/#' domain-modeling/SKILL.md domain-modeling/ADR-FORMAT.md setup-matt-pocock-skills/SKILL.md setup-matt-pocock-skills/domain.md
```

The first expression keeps the `←` comment column aligned in tree diagrams (`decisions/` is six characters longer than `adr/`). On Linux, drop the `''` after `-i`.

## 2. House ADR template in `domain-modeling/ADR-FORMAT.md`

Upstream's ADR format is a minimal one-paragraph template with `0001-` numbering. This repo's ADRs use a fuller house style, so after step 1 edit `.agents/skills/domain-modeling/ADR-FORMAT.md` by hand:

- Numbering line: `sequential 3-digit numbering: 001-slug.md, 002-slug.md, etc.` (not `0001-`).
- Replace upstream's `## Template` and `## Optional sections` with a `## Template (house style)` section: a code block with `# {Short title}`, `Date: {YYYY-MM-DD}`, `Status: {accepted | proposed | deprecated | superseded by [NNN-slug.md](./NNN-slug.md)}`, and `## Context`, `## Decision`, `## Consequences` sections, followed by the guidance to keep each section tight but not drop any (consistency with the existing `docs/decisions/` set matters more than brevity), and to cross-link superseding ADRs with a `Supersedes:` / `Status: superseded by` line.
- `## Numbering`: append the note that a couple of historical numbers are duplicated (e.g. two `007-` files), so go by the highest number present, not the count.

Keep upstream's wording everywhere else in the file (for example the "When to offer an ADR" criteria). Use `git diff` against the previous commit to carry the house sections across.

## Verify

```sh
grep -rn -E 'docs/adr|── adr/' .agents/skills/{domain-modeling,setup-matt-pocock-skills}
grep -n -E '3-digit|house style|007-' .agents/skills/domain-modeling/ADR-FORMAT.md
```

The first command must print nothing. The second must show the numbering line, the house template heading, and the duplicate-number note.

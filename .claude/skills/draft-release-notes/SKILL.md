---
name: draft-release-notes
description: Draft a user-friendly "What's Changed" section for the NWAC web (NWACus/web) GitHub release. Use this skill whenever the user is preparing a release for that repo, mentions drafting release notes, asks for a "what's changed" section, says "draft this release", or pastes in GitHub's auto-generated release draft asking for help. Reorganizes PRs by user impact (Features / Bug Fixes / Infra-CI / For-the-devs), translates technical PR titles into language for avalanche center admins, writes a 2-3 sentence intro paragraph naming the release themes with a hero visual callout, and produces a ranked list of where to add screenshots vs. gifs.
---

# Draft Release Notes

Draft a clear, user-friendly **"What's Changed"** section for a GitHub release of the
NWAC web app (`NWACus/web`). The audience is **avalanche center admins** (NWAC, DVAC,
SAC, SNFAC) — non-engineers who manage content — plus the dev team. Translate technical
PR titles into plain language about what changed for them.

## When to use

Trigger this skill whenever the user:

- is preparing or cutting a release for `NWACus/web`,
- mentions "draft release notes" / "what's changed" / "draft this release",
- pastes GitHub's auto-generated release draft and asks for help cleaning it up.

## Step 1 — Gather the list of changes

Use whatever the user gives you first. If they paste GitHub's auto-generated draft, parse
the PR list from it. Otherwise, collect the unreleased PRs yourself:

```bash
# From the repo root — lists PRs merged to main but not yet on the release branch,
# with dates and clickable GitHub links.
./unreleased-prs.sh
```

The NWAC release flow is **`release` ← `main`**: a release promotes everything currently
on `main` that isn't yet on the `release` branch. `unreleased-prs.sh` walks
`git log release..main --first-parent` and extracts each PR number, date, and branch name.

For richer titles/labels you can also pull from GitHub:

```bash
gh pr list --repo NWACus/web --state merged --base main --limit 100 \
  --json number,title,labels,mergedAt,author
```

Filter to PRs not yet released (merged after the last release tag) if needed:

```bash
gh release view --repo NWACus/web --json tagName,publishedAt
```

## Step 2 — Categorize every PR by user impact

Sort every PR into exactly one of these four buckets, **ordered by how much an avalanche
center admin cares**:

1. **✨ Features** — new capabilities or visible improvements admins/end-users will notice.
2. **🐛 Bug Fixes** — things that were broken and now work.
3. **🔧 Infra & CI** — deploys, pipelines, build, monitoring, dependency bumps that keep
   the lights on but aren't user-facing. (Dependabot PRs usually collapse into a single
   summarized line here, e.g. "Routine dependency updates".)
4. **🧑‍💻 For the devs** — refactors, tests, types, tooling, internal-only changes.

Heuristics:

- Use PR labels when present (`feature`, `bug`/`fix`, `ci`, `chore`, `dependencies`,
  `refactor`, `test`).
- Lean on the branch prefix from the merge message: `feat/…`, `fix/…`, `chore/…`,
  `infra/…`, `ci/…`, `refactor/…`, `test/…`.
- When in doubt, ask: _would a center admin notice this?_ Yes → Features/Bug Fixes.
  No → Infra-CI / For-the-devs.

## Step 3 — Rewrite each line for the audience

Translate technical PR titles into outcome-focused language for non-engineers.

- Lead with the user benefit, not the implementation.
- Keep each item to one line; append the PR link/number.
- Drop internal jargon (collection names, hook names, component names) from
  Features/Bug Fixes lines — keep those in the For-the-devs bucket where devs read them.

Examples:

- `feat/forecast-og-image` → "Forecast pages now generate a rich preview image when shared
  on social media or in messages (#1103)"
- `fix/stabilize-admin-e2e` → move to **For the devs** as "Stabilized admin end-to-end
  tests (#1109)" — not user-facing.
- `Bump protobufjs from 7.5.5 to 7.5.8` → collapse into Infra & CI: "Routine dependency
  and security updates".

## Step 4 — Write the intro paragraph

Open the notes with a **2–3 sentence intro** that names the release's themes (the 1–2
threads that tie the biggest PRs together) and includes a **hero visual callout** — a
one-line prompt telling the editor where the single most impactful screenshot/gif should
go at the top.

> **Hero visual:** _[Add a screenshot or gif of <the headline feature> here.]_

## Step 5 — Rank where to add visuals

End with a short, **ranked** list of where screenshots vs. gifs would most help, highest
impact first. Recommend:

- **gif** for anything with motion/interaction (new flows, animations, multi-step UI),
- **screenshot** for static visual changes (new pages, layout, styling).

Each entry: what to capture, screenshot-vs-gif, and which release line it supports.

## Output format

Produce a single markdown block the user can paste straight into the GitHub release body:

```markdown
<2–3 sentence intro naming the themes>

> **Hero visual:** _[Add a screenshot/gif of <headline feature> here.]_

## ✨ Features

- <plain-language change> (#NNNN)

## 🐛 Bug Fixes

- <plain-language change> (#NNNN)

## 🔧 Infra & CI

- <change or collapsed summary> (#NNNN)

## 🧑‍💻 For the devs

- <change> (#NNNN)
```

Then, separately (not part of the pasteable block), output:

```markdown
### 📸 Suggested visuals (ranked)

1. **[gif]** <what to capture> — supports "<release line>"
2. **[screenshot]** <what to capture> — supports "<release line>"
```

## Notes

- Always include the PR number/link on each line so the auto-generated changelog and the
  `post-release` commenter (which comments "included in version …" on each merged PR)
  stay traceable.
- If a bucket is empty, omit its heading rather than printing an empty section.
- Keep the whole "What's Changed" block skimmable — admins should grasp the release in
  under a minute.

# Fallow (dead-code & code-health)

[Fallow](https://docs.fallow.tools) finds unused code, circular dependencies, duplication, and complexity hotspots. Config lives in `.fallowrc.json`. We gate it two ways, for two different jobs:

- **`pnpm fallow:audit`** — *changed-files PR gate*. Did **this change** introduce anything new?
- **`pnpm fallow:check`** — *whole-repo gate*. Is there any dead code / duplication **beyond what we've accepted**?

CI runs both.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm fallow` | Full repo scan (dead-code + dupes + health), no gating. Use this to *see* findings. |
| `pnpm fallow health` | Complexity / maintainability report (hotspots, CRAP scores). Informational — not gated (see below). |
| `pnpm fallow:audit` | Changed-files gate. Scans only files changed since the merge-base and fails only on findings the change **introduced** (`--gate new-only`). No baseline — it uses merge-base attribution. CI adds `--changed-since origin/main`. |
| `pnpm fallow:check` | Whole-repo gate. Fails if there's any unused code or duplication **not already recorded** in the baselines. |
| `pnpm fallow:baseline` | Re-snapshot the dead-code + dupes baselines. See cautions below. |

## `audit` vs `check` (why two commands)

`audit` is scoped to changed files and only fails on findings **introduced** by the change — findings in *unchanged* files are reported as "inherited" but never fail the verdict. This means changing `.fallowrc.json` alone (e.g. removing an `ignoreExports` entry) will **not** make `audit` complain about the now-visible code, because that code lives in unchanged files. To see those findings, run `pnpm fallow`.

`check` covers the gap: it scans the whole repo and fails on any unused-code/duplication finding that isn't in the baseline, catching dead code that accumulates in files no single PR happens to touch.

## Baselines

`fallow-baselines/{dead-code,dupes}.json` record the findings we've accepted. `fallow:check` **suppresses** these and fails only on findings beyond them, so it exits clean (`✓`) when nothing new has appeared.

Refresh them with `pnpm fallow:baseline` **only** when intentionally re-accepting the current state — e.g. after merging main pulls pre-existing findings into scope, or after a deliberate cleanup. Do **not** refresh to clear a finding you intend to fix — that just bakes it into the baseline and hides it. Commit the baseline change alongside the code change that justifies it.

Two deliberate omissions:

- **`audit` takes no baseline.** Its merge-base attribution already separates new from inherited findings; passing snapshot baselines to it is redundant and produces a misleading "matched 0 current issues" warning.
- **Health is not gated.** `fallow health` is a maintainability *score report* — it always flags functions above the complexity threshold, so it never exits clean and can't act as a pass/fail gate. Run `pnpm fallow health` manually to review hotspots and refactoring targets.

## For agents

Before deleting code fallow calls "unused", trace it first — entry points and dynamic usage can be missed:

- export/file: `pnpm fallow dead-code --trace <file>:<export>`
- dependency: `pnpm fallow dead-code --trace-dependency <name>`
- explain a finding type: `pnpm fallow explain <issue-type>`

To intentionally keep flagged code, add an `ignoreExports`/`ignorePatterns` entry in `.fallowrc.json` or a `// fallow-ignore-next-line <issue-type>` comment — prefer fixing over ignoring.

Note: `ignoreExportsUsedInFile: true` (set in `.fallowrc.json`) means an export is **not** flagged as unused if it's referenced within its own file. This filters intentional internal-use exports, so a symbol that's only consumed in its own module won't show up as an unused export — only a needless `export` keyword, which fallow can't distinguish from a deliberate one.

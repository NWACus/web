# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker, and documents the rest of the label vocabulary so agent-assisted triage and reality stay in sync.

## Canonical triage roles

The five **state** roles map one-to-one to labels of the same name. Every triaged issue carries exactly one state label plus exactly one category label.

| Canonical role    | Label in our tracker | Meaning                                  |
| ----------------- | -------------------- | ---------------------------------------- |
| `needs-triage`    | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`      | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent` | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human` | `ready-for-human`    | Requires human implementation            |
| `wontfix`         | `wontfix`            | Will not be actioned                     |

The two **category** roles are `bug` and `enhancement`. Tech-debt work is an `enhancement` carrying the `tech debt` modifier, not a third category.

## Other labels

These are not triage states, but they coexist with them on issues:

| Label               | Kind      | Meaning                                                                    |
| ------------------- | --------- | ------------------------------------------------------------------------- |
| `good first issue`  | modifier  | Suitable for an open-source contributor; pair with an agent-style brief.   |
| `tech debt`         | modifier  | Internal quality work; applied alongside `enhancement`.                    |
| `blocked`           | modifier  | Blocked by a dependency or other change; orthogonal to state.             |
| `payload-workaround`| modifier  | Tracks a workaround to revisit when the upstream Payload fix lands.        |
| `tenant:<slug>`     | scoping   | Specific to one avalanche center (e.g. `tenant:nwac`). New slugs created on demand. |
| `dependencies`      | PR label  | Dependabot dependency-update PRs. Not part of issue triage.               |
| `javascript`        | PR label  | Dependabot JavaScript PRs. Not part of issue triage.                       |
| `visual-recap`      | PR label  | Opts a PR in to an interactive visual recap. Nothing runs without it. Not part of issue triage. |

### When to reach for `visual-recap`

The [PR Visual Recap workflow](../../.github/workflows/pr-visual-recap.yml) is opt-in: no recap is generated until this label is on the PR. Add it when the diff is genuinely worth a guided walkthrough — large or multi-file, UI-heavy, or touching database schema, API contracts, permissions/access control, or architecture. `src/collections`, `src/migrations`, `src/access`, `src/globals`, `src/middleware.ts`, `src/payload.config.ts`, and `src/app/api` are the review-critical paths where a recap most often earns its keep.

Skip it — that is, do nothing — for anything that reviews faster in the GitHub diff: small fixes, mechanical sweeps, formatting passes, regenerated types, lockfile bumps, generated migration boilerplate.

Adding the label generates a recap immediately and keeps it refreshed on every later push, plus marks the plan merged when the PR merges. Removing it stops further runs, but leaves an already-published recap marked unmerged.

A recap that fails to generate now fails the workflow rather than quietly posting a "generation failed" comment under a green run. That check is not required, so it never blocks a merge — but it is the signal that the recap plumbing needs attention, most often an expired `PLAN_RECAP_TOKEN` or an organization the Plan app will not publish an org-visible recap for. The gate additionally probes the token before spending ~15 minutes of Opus, which catches the expired-token case early; the organization case only surfaces at publish time.

## Auto-labeling on arrival

Issue templates stamp a starting state so the untriaged bucket never silently regrows:

- **Bug report** → `bug`, `needs-triage`
- **Blank issue** → `needs-triage`
- **Claude Task** → `ready-for-agent` (a maintainer-authored Claude task is fully specified by construction)

## History

This vocabulary was consolidated in PRD [#1132](https://github.com/NWACus/web/issues/1132). Legacy labels were migrated (`NEW` → `needs-triage`, `needs user feedback` → `needs-info`, `needs-investigation` → `needs-triage`) and retired labels removed (`question`, `quick fix`, `urgent`, `area:admin`, `area:frontend`, `area:backend`, `area:infra`). `NWAC Specific` was renamed to `tenant:nwac`.

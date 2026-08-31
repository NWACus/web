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
| `visual-recap`      | PR label  | Forces an interactive visual recap on a PR the size gate would skip. Not part of issue triage. |
| `no-visual-recap`   | PR label  | Opts a PR out of the visual recap. Beats `visual-recap` and the size gate. Not part of issue triage. |

### When to reach for `no-visual-recap`

The [PR Visual Recap workflow](../../.github/workflows/pr-visual-recap.yml) already skips tiny diffs on its own, so the label is only worth adding when the gate would say *run* but a recap would not earn its keep. In practice that means a diff that is **large or touches a sensitive path, yet is mechanical**: a codemod or rename sweep, a formatting pass, regenerated types, a lockfile bump, or generated migration boilerplate. The gate force-runs at 25+ files or 1500+ changed lines, and any touch of `src/collections`, `src/migrations`, `src/access`, `src/globals`, `src/middleware.ts`, `src/payload.config.ts`, or `src/app/api` disqualifies a PR from the tiny-diff skip — those are the cases where a human or agent knows better than the heuristic.

Do not add it to ordinary small PRs; the gate handles those, and the label just adds noise. Adding it to a PR that already has a published recap stops further runs but leaves that recap marked unmerged.

## Auto-labeling on arrival

Issue templates stamp a starting state so the untriaged bucket never silently regrows:

- **Bug report** → `bug`, `needs-triage`
- **Blank issue** → `needs-triage`
- **Claude Task** → `ready-for-agent` (a maintainer-authored Claude task is fully specified by construction)

## History

This vocabulary was consolidated in PRD [#1132](https://github.com/NWACus/web/issues/1132). Legacy labels were migrated (`NEW` → `needs-triage`, `needs user feedback` → `needs-info`, `needs-investigation` → `needs-triage`) and retired labels removed (`question`, `quick fix`, `urgent`, `area:admin`, `area:frontend`, `area:backend`, `area:infra`). `NWAC Specific` was renamed to `tenant:nwac`.

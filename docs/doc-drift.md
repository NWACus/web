# Doc Drift

Docs rot quietly: code changes, the doc describing it doesn't, and nobody notices until the doc misleads someone. **Drift** (the `drift` CLI, v0.10.0) fixes that by _binding_ docs to the code they describe. When bound code changes, drift flags the doc as stale so a human reviews it.

The key idea: **stale means "please re-read this," not "this is broken."** A flag is a prompt to check the doc against the new code — often the doc is still fine and you just re-confirm the binding.

## Prerequisites: install drift

drift is a standalone binary, **not** an npm dependency — `pnpm install` does not provide it. You need it on your PATH because **pre-commit runs `pnpm drift:check`** (which shells out to `drift`); without it, your commits fail.

```bash
# macOS / Linux (Homebrew)
brew install fiberplane/tap/drift
```

Or download the **v0.10.0** binary for your platform from the [drift releases page](https://github.com/fiberplane/drift/releases/tag/v0.10.0) (`drift-aarch64-macos`, `drift-x86_64-macos`, `drift-aarch64-linux`, `drift-x86_64-linux`) and put it on your PATH. Pin to **v0.10.0** to match CI and the signature format in `drift.lock`.

Verify with `drift --version`.

## How it works

- Bindings live in [`drift.lock`](../drift.lock) at the repo root. Each binding ties a doc (or a specific section of it) to one or more code files.
- Drift hashes the bound code. When the code changes, the hash no longer matches and the doc is reported **stale**.
- Drift also checks that markdown links between docs point somewhere real (**broken link**).
- It runs automatically in **pre-commit** and in the **CI `drift` job**, so a drifted doc blocks the commit / fails the build until reviewed.

## The everyday workflow

You'll usually meet drift when a commit or CI run fails. The loop is always the same:

1. **Read the flagged doc.** Does it still match the code you changed?
2. **Update it** if it's wrong or incomplete.
3. **Re-confirm the binding** so the hash updates and the flag clears:

   ```bash
   drift refs <changed-file>                                    # which docs cover this file
   drift link <doc-path> <changed-file> --doc-is-still-accurate # after you've reviewed the doc
   ```

`--doc-is-still-accurate` is you telling drift "I looked, it's fine now" — it re-hashes the code and clears the flag. Without that flag, `drift link` adds a _new_ binding instead.

## Checking everything yourself

```bash
pnpm drift:check
```

**Always use `pnpm drift:check`, never raw `drift check`.** The pnpm script wraps drift ([`scripts/drift-check.mjs`](../scripts/drift-check.mjs)) to exclude vendored Claude skill bundles under `.agents/skills/` and `.claude/skills/` — their internal links point at directories we don't vendor and would otherwise show up as false-positive broken links. Pre-commit and CI both use the wrapper.

## Reading the output

| Result | What it means | What to do |
| --- | --- | --- |
| **stale doc / stale anchor** | Bound code changed since the doc was last confirmed | Re-read the doc, update if needed, then `drift link ... --doc-is-still-accurate` |
| **broken link** | A markdown link points at a file/anchor that doesn't exist | Fix the link target in the doc |

## Managing bindings

| Task | Command |
| --- | --- |
| See which docs cover a file | `drift refs <file>` |
| Bind a doc to code (new coverage) | `drift link <doc-path> <file>` |
| Re-confirm after reviewing | `drift link <doc-path> <file> --doc-is-still-accurate` |
| Remove a binding (code deleted/renamed) | `drift unlink <doc-path> <file>` |
| List all docs and their bindings | `drift status` |

When you **rename or delete** bound code, `drift unlink` the old path and `drift link` the new one so bindings don't dangle. When you **write a new doc**, link it to the code it references so it starts getting freshness checks too.

> These commands call `drift` directly, not `pnpm drift`. Only `check` has a pnpm wrapper (to exclude vendored skill bundles — see above); `link`, `unlink`, `refs`, and `status` have no wrapper, so you run the binary itself.

---

This doc is the human explainer. The agent-facing checklist lives in the **Doc Drift** section of [`../CLAUDE.md`](../CLAUDE.md); the pre-commit failure quick-fix is in [`troubleshooting.md`](troubleshooting.md).

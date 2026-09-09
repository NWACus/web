import { readFileSync } from 'fs'
import path from 'path'

/**
 * The PR Visual Recap workflow's decision logic lives in `actions/github-script`
 * blocks, which nothing else type-checks or exercises. It is also the layer that
 * turns a silently-failing recap into a red check, so a regression here is
 * invisible by construction — the failure mode it guards against is a green run.
 *
 * These tests read the scripts straight out of the workflow and run them against
 * stubbed `core` / `github` / `fetch`, so they exercise the shipped source
 * rather than a copy.
 */

const WORKFLOW = path.join(process.cwd(), '.github/workflows/pr-visual-recap.yml')

// Pull each `script: |` block out by indentation. No YAML parser is available in
// this repo's dependencies, and the block scalars contain no YAML to interpret.
function extractInlineScripts(yaml: string): string[] {
  const lines = yaml.split('\n')
  const scripts: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)script: \|\s*$/)
    if (!match) continue
    const indent = match[1].length + 2
    const body: string[] = []
    let j = i + 1
    while (j < lines.length && (lines[j].trim() === '' || lines[j].search(/\S/) >= indent)) {
      body.push(lines[j].slice(indent))
      j++
    }
    scripts.push(body.join('\n'))
    i = j - 1
  }
  return scripts
}

const scripts = extractInlineScripts(readFileSync(WORKFLOW, 'utf8'))
const [, preflightScript, verifyScript] = scripts

type Outcome = 'notice' | 'warning' | 'failed' | 'none'

function makeCore() {
  const state: { outcome: Outcome; message: string } = { outcome: 'none', message: '' }
  return {
    state,
    core: {
      notice: (m: string) => {
        state.outcome = 'notice'
        state.message = m
      },
      warning: (m: string) => {
        state.outcome = 'warning'
        state.message = m
      },
      setFailed: (m: string) => {
        state.outcome = 'failed'
        state.message = m
      },
    },
  }
}

// github-script wraps the block in an async function, so mirror that here.
function runScript(source: string, scope: Record<string, unknown>) {
  const names = Object.keys(scope)
  const fn = new Function(...names, `return (async () => {\n${source}\n})()`)
  return fn(...names.map((n) => scope[n]))
}

const HEAD_SHA = '681e89103a41f02b5bfcfddc2c0e3cb3ca522c83'

const ORG_GUARD_BODY =
  '{"error":"Creating an org-visible visual recap requires an active organization. Connect Plan from an organization or publish with private visibility."}'

describe('pr-visual-recap workflow scripts', () => {
  it('extracts all three inline scripts', () => {
    expect(scripts).toHaveLength(3)
    expect(preflightScript).toContain('create-visual-recap')
    expect(verifyScript).toContain('set-resource-visibility')
  })

  describe('plan-app preflight', () => {
    async function probe(response: { status: number; body: string } | { throws: string }) {
      const { state, core } = makeCore()
      let requests = 0
      const fetchStub = async () => {
        requests++
        if ('throws' in response) throw new Error(response.throws)
        return { status: response.status, text: async () => response.body }
      }
      await runScript(preflightScript, {
        core,
        fetch: fetchStub,
        process: { env: { PLAN_RECAP_TOKEN: 'token' } },
        AbortSignal,
      })
      return { ...state, requests }
    }

    it('fails the gate when the token is revoked', async () => {
      const result = await probe({ status: 401, body: '{"error":"unauthorized"}' })
      expect(result.outcome).toBe('failed')
      expect(result.message).toContain('expired or revoked')
    })

    // Unreachable with an empty body today, since validation rejects it first.
    // Kept as a safety net for the app surfacing the guard earlier.
    it('fails the gate on the inactive-organization guard', async () => {
      const result = await probe({ status: 403, body: ORG_GUARD_BODY })
      expect(result.outcome).toBe('failed')
      expect(result.message).toContain('active organization')
    })

    it('matches the org guard on the message, not the status code', async () => {
      const result = await probe({ status: 200, body: ORG_GUARD_BODY })
      expect(result.outcome).toBe('failed')
    })

    // Verified against the live app: it answers auth (401) before it validates
    // the payload (400), and only applies the org-visibility guard (403) after
    // that. So a 400 here means the token cleared auth — which is as far as a
    // probe that cannot create a plan is able to see.
    it('treats the rejection of its empty probe body as healthy', async () => {
      for (const status of [400, 422]) {
        const result = await probe({ status, body: '{"error":"title is required"}' })
        expect(result.outcome).toBe('notice')
      }
    })

    it('does not block a recap on an unrelated 403', async () => {
      const result = await probe({ status: 403, body: '{"error":"rate limited"}' })
      expect(result.outcome).toBe('warning')
    })

    it('does not block a recap when the plan app is unreachable', async () => {
      const result = await probe({ throws: 'fetch failed' })
      expect(result.outcome).toBe('warning')
      expect(result.requests).toBe(1)
    })
  })

  describe('recap verification', () => {
    async function verify(commentBody: string | null) {
      const { state, core } = makeCore()
      let publicized = false
      const github = {
        rest: {
          issues: {
            listComments: async () => ({
              data: commentBody ? [{ user: { type: 'Bot' }, body: commentBody }] : [],
            }),
          },
        },
      }
      await runScript(verifyScript, {
        core,
        github,
        context: {
          repo: { owner: 'NWACus', repo: 'web' },
          payload: { pull_request: { number: 1, head: { sha: HEAD_SHA } } },
        },
        fetch: async () => {
          publicized = true
          return { ok: true, status: 200, text: async () => 'ok' }
        },
        process: { env: { PLAN_RECAP_TOKEN: 'token' } },
      })
      return { ...state, publicized }
    }

    const success = [
      '<!-- pr-visual-recap -->',
      "Here's a [visual recap](https://plan.agent-native.com/recaps/abc123) of what changed:",
      '',
      '<!-- plan-id: abc123 -->',
      '',
      `<!-- head-sha: ${HEAD_SHA} -->`,
    ].join('\n')

    it('publicizes a published recap', async () => {
      const result = await verify(success)
      expect(result.publicized).toBe(true)
      expect(result.outcome).toBe('notice')
    })

    it('publicizes when only the screenshot failed', async () => {
      const body = success.replace(
        "Here's a [visual recap]",
        '### Visual recap — screenshot failed\n\nA recap was published: [visual recap]',
      )
      const result = await verify(body)
      expect(result.publicized).toBe(true)
    })

    it('fails on a generation failure, quoting the diagnostic', async () => {
      const body = [
        '<!-- pr-visual-recap -->',
        '### Visual recap — generation failed',
        '',
        'The visual recap could not be generated for this pull request. This is informational only.',
        '',
        'Diagnostic:',
        '',
        `No plan URL: create-visual-recap failed 403 Forbidden: ${ORG_GUARD_BODY}`,
        '',
        `<!-- head-sha: ${HEAD_SHA} -->`,
      ].join('\n')
      const result = await verify(body)
      expect(result.outcome).toBe('failed')
      expect(result.message).toContain('active organization')
      expect(result.publicized).toBe(false)
    })

    it('fails rather than publicizing a previous run plan id after a failure', async () => {
      // The recap CLI keeps the last-good plan-id marker on a failure comment so
      // the next push can replace the plan in place. Treating that as success
      // would republish a stale recap under a green check.
      const body = [
        '<!-- pr-visual-recap -->',
        '### Visual recap — generation failed',
        '',
        'Diagnostic:',
        '',
        'No plan URL: create-visual-recap failed 403 Forbidden.',
        '',
        '<!-- plan-id: previousrun -->',
        '',
        `<!-- head-sha: ${HEAD_SHA} -->`,
      ].join('\n')
      const result = await verify(body)
      expect(result.outcome).toBe('failed')
      expect(result.publicized).toBe(false)
    })

    it('passes on an upstream suppression', async () => {
      const body = [
        '<!-- pr-visual-recap -->',
        '### Visual recap — not generated',
        '',
        'The recap was **suppressed** because the diff matched a secret pattern.',
        '',
        `<!-- head-sha: ${HEAD_SHA} -->`,
      ].join('\n')
      const result = await verify(body)
      expect(result.outcome).toBe('notice')
      expect(result.publicized).toBe(false)
    })

    it('ignores a comment stamped with an older head', async () => {
      const result = await verify(success.replace(HEAD_SHA, 'a'.repeat(40)))
      expect(result.outcome).toBe('notice')
      expect(result.publicized).toBe(false)
    })

    it('passes when no recap comment exists', async () => {
      const result = await verify(null)
      expect(result.outcome).toBe('notice')
      expect(result.publicized).toBe(false)
    })
  })
})

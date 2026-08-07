/**
 * Standard msw server lifecycle for a suite: intercept for the whole run, reset per-test handler
 * overrides between tests, and shut down at the end.
 *
 * `onUnhandledRequest: 'error'` is the important part — a request the suite did not stub fails
 * loudly instead of escaping to the real network, which is how a mis-set NAC_HOST surfaced as a
 * confusing crash rather than "nothing intercepted this".
 *
 * Lives outside `__tests__/client` and `__tests__/server` so neither jest project collects it.
 *
 * Deliberately not named `use*`: eslint's react-hooks/rules-of-hooks treats any `useX()` call at
 * module top level as a misplaced React Hook.
 */
import type { setupServer } from 'msw/node'

type MswServer = ReturnType<typeof setupServer>

export function setupMswLifecycle(server: MswServer): void {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}

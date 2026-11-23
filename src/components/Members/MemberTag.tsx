'use client'

import { ROOT_SITE_URL } from '@/utilities/domain'
import { cn } from '@/utilities/ui'
import { useEffect, useState } from 'react'
import { readSessionUser } from './memberAuthClient'

type MemberSession = ReturnType<typeof readSessionUser>

/** The apex hand-off that gives this center host a site session and comes back here. */
const signInHref = () =>
  `${ROOT_SITE_URL}/api/auth/site-session/handoff?returnTo=${encodeURIComponent(window.location.href)}`

async function fetchSession(): Promise<MemberSession> {
  try {
    const res = await fetch('/api/auth/get-session')
    return readSessionUser(res.ok ? await res.json() : null)
  } catch {
    return null
  }
}

const pill =
  'rounded-full border bg-background px-3 py-1.5 text-sm shadow-md hover:bg-accent focus:outline-none focus:ring-2'

const signOut = () =>
  fetch('/api/auth/sign-out', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })

function SignedInTag({
  session,
  onSignOut,
}: {
  session: NonNullable<MemberSession>
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-1 rounded-lg border bg-background p-2 text-sm shadow-md">
          <a className="rounded px-2 py-1 hover:bg-accent" href={`${ROOT_SITE_URL}/members`}>
            Manage account
          </a>
          <button
            type="button"
            className="rounded px-2 py-1 text-left hover:bg-accent"
            onClick={() => void signOut().finally(onSignOut)}
          >
            Sign out
          </button>
        </div>
      )}
      <button
        type="button"
        className={pill}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {session.isAnonymous ? 'Anonymous member' : session.email}
      </button>
    </div>
  )
}

/**
 * Floating Member tag for center sites (ADR 026). Pages are ISR-cached, so the session is read
 * client-side; `fixed` keeps it out of the layout. Signed out: a link into the apex hand-off.
 * Signed in: the Member's email, "Manage account" on the apex, and sign out.
 */
export function MemberTag() {
  const [session, setSession] = useState<MemberSession | undefined>(undefined)

  useEffect(() => {
    void fetchSession().then(setSession)
  }, [])

  if (session === undefined) return null
  if (session === null) {
    return (
      <a className={cn('fixed bottom-4 right-4 z-50', pill)} href={signInHref()}>
        Sign in
      </a>
    )
  }
  return <SignedInTag session={session} onSignOut={() => setSession(null)} />
}

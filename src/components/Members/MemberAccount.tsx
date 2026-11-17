'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type SessionResponse = {
  user?: { email?: string; isAnonymous?: boolean }
  session?: { scope?: string }
} | null

function useMemberSession() {
  const [session, setSession] = useState<SessionResponse | undefined>(undefined)
  const reload = useCallback(
    () =>
      fetch('/api/auth/get-session')
        .then((res) => (res.ok ? res.json() : null))
        .then((json: SessionResponse) => setSession(json))
        .catch(() => setSession(null)),
    [],
  )
  useEffect(() => {
    void reload()
  }, [reload])
  const status: 'loading' | 'signed-in' | 'signed-out' =
    session === undefined ? 'loading' : session?.user ? 'signed-in' : 'signed-out'
  return { status, session, reload }
}

const post = (path: string, body: unknown = {}) =>
  fetch(`/api/auth${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

function SessionPlaceholder({ status }: { status: 'loading' | 'signed-out' }) {
  if (status === 'loading') return <p className="py-16 text-center">Loading…</p>
  return (
    <div className="mx-auto max-w-sm py-16">
      <p>You are not signed in.</p>
      <Link className="underline" href="/members/sign-in">
        Sign in
      </Link>
    </div>
  )
}

/** Links that hand this apex session to a center host as a site session. */
function CenterLinks({ hosts }: { hosts: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-medium">Open a center site signed in</h2>
      {hosts.map((host) => (
        <a
          key={host}
          className="underline"
          href={`/api/auth/site-session/handoff?returnTo=${encodeURIComponent(`${window.location.protocol}//${host}/`)}`}
        >
          {host}
        </a>
      ))}
    </div>
  )
}

/** POC account home on the apex: shows the session, hands off to a center, signs out, deletes. */
export function MemberAccount({ centerHosts }: { centerHosts: string[] }) {
  const { status, session, reload } = useMemberSession()
  const [notice, setNotice] = useState<string | null>(null)

  const requestDeletion = () =>
    post('/delete-user', { callbackURL: '/members' }).then((res) =>
      setNotice(
        res.ok
          ? 'Check your email to confirm deletion.'
          : `Could not start deletion (${res.status}).`,
      ),
    )

  if (status !== 'signed-in') return <SessionPlaceholder status={status} />

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 py-16">
      <h1 className="text-2xl font-semibold">Your Avy account</h1>
      <pre className="overflow-auto rounded border p-3 text-xs">
        {JSON.stringify(session, null, 2)}
      </pre>
      <CenterLinks hosts={centerHosts} />
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => void post('/sign-out').then(reload)}>
          Sign out
        </Button>
        <Button variant="destructive" onClick={() => void requestDeletion()}>
          Delete account
        </Button>
      </div>
      {notice && <p className="text-sm">{notice}</p>}
    </div>
  )
}

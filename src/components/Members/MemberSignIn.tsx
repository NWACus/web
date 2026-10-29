'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, type FormEvent } from 'react'
import { postAuth, safeReturnTo, socialRedirectUrl } from './memberAuthClient'

type StepProps = {
  busy: boolean
  onSubmit: (event: FormEvent) => void
}

function EmailStep({
  busy,
  email,
  onEmail,
  onSubmit,
}: StepProps & { email: string; onEmail: (v: string) => void }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="text-sm" htmlFor="member-email">
        Email
      </label>
      <Input
        id="member-email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => onEmail(e.target.value)}
      />
      <Button type="submit" disabled={busy}>
        Email me a code
      </Button>
    </form>
  )
}

function OtpStep({
  busy,
  email,
  otp,
  onOtp,
  onBack,
  onSubmit,
}: StepProps & { email: string; otp: string; onOtp: (v: string) => void; onBack: () => void }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <p className="text-sm">We sent a 6-digit code to {email}.</p>
      <Input
        inputMode="numeric"
        pattern="[0-9]{6}"
        required
        autoComplete="one-time-code"
        value={otp}
        onChange={(e) => onOtp(e.target.value)}
      />
      <Button type="submit" disabled={busy}>
        Sign in
      </Button>
      <Button type="button" variant="ghost" onClick={onBack}>
        Use a different email
      </Button>
    </form>
  )
}

/** POC sign-in for Members on the apex: email OTP, or Google when it is configured. */
export function MemberSignIn({ returnTo }: { returnTo?: string }) {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = (action: () => Promise<void>) => (event?: FormEvent) => {
    event?.preventDefault()
    setBusy(true)
    setError(null)
    action()
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Something went wrong'),
      )
      .finally(() => setBusy(false))
  }

  const sendCode = run(async () => {
    await postAuth('/email-otp/send-verification-otp', { email, type: 'sign-in' })
    setStep('otp')
  })
  const verifyCode = run(async () => {
    await postAuth('/sign-in/email-otp', { email, otp })
    window.location.assign(safeReturnTo(returnTo))
  })
  const google = run(async () => {
    const url = socialRedirectUrl(
      await postAuth('/sign-in/social', {
        provider: 'google',
        callbackURL: safeReturnTo(returnTo),
      }),
    )
    if (url) window.location.assign(url)
  })

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-16">
      <h1 className="text-2xl font-semibold">Sign in to Avy</h1>
      {step === 'email' ? (
        <EmailStep busy={busy} email={email} onEmail={setEmail} onSubmit={sendCode} />
      ) : (
        <OtpStep
          busy={busy}
          email={email}
          otp={otp}
          onOtp={setOtp}
          onBack={() => setStep('email')}
          onSubmit={verifyCode}
        />
      )}
      <Button type="button" variant="outline" onClick={() => google()} disabled={busy}>
        Continue with Google
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

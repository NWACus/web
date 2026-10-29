import MemberDeleteAccountEmail from '@/emails/member-delete-account-email'
import MemberOtpEmail, { type MemberOtpEmailProps } from '@/emails/member-otp-email'
import { pretty, render } from '@react-email/render'
import type { Payload } from 'payload'
import { createElement, type ReactElement } from 'react'
import { APEX_ORIGIN } from './hosts'

async function send(payload: Payload, to: string, subject: string, element: ReactElement) {
  const [html, text] = await Promise.all([
    render(element).then(pretty),
    render(element, { plainText: true }),
  ])
  await payload.sendEmail({ to, subject, html, text })
}

/** Avy-branded OTP through Payload's email adapter (Resend in production). */
export function sendMemberOtp(
  payload: Payload,
  email: string,
  otp: string,
  purpose: MemberOtpEmailProps['purpose'],
) {
  return send(
    payload,
    email,
    `${otp} is your Avy code`,
    createElement(MemberOtpEmail, { appUrl: APEX_ORIGIN, otp, purpose }),
  )
}

export function sendMemberDeleteAccount(payload: Payload, email: string, confirmUrl: string) {
  return send(
    payload,
    email,
    'Confirm deleting your Avy account',
    createElement(MemberDeleteAccountEmail, { appUrl: APEX_ORIGIN, confirmUrl }),
  )
}

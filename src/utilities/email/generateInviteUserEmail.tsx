import InviteUserEmail, { InviteUserEmailProps } from '@/emails/invite-user-email'
import { pretty, render } from '@react-email/render'

export async function generateInviteUserEmail({ appUrl, inviteUrl }: InviteUserEmailProps) {
  const [html, text] = await Promise.all([
    render(<InviteUserEmail inviteUrl={inviteUrl} appUrl={appUrl} />).then(pretty),
    render(<InviteUserEmail inviteUrl={inviteUrl} appUrl={appUrl} />, {
      plainText: true,
    }),
  ])

  return { html, text, subject: "You've been invited to AvyFx" }
}

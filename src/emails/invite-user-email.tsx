import { Heading, Text } from '@react-email/components'
import EmailButton from './_components/EmailButton'
import EmailLayout from './_components/EmailLayout'

export type InviteUserEmailProps = {
  appUrl: string
  inviteUrl: string
}

export function InviteUserEmail({ appUrl, inviteUrl }: InviteUserEmailProps) {
  return (
    <EmailLayout appUrl={appUrl}>
      <Heading as="h1" style={{ textAlign: 'center' }}>
        You{`'`}ve been invited to AvyFx
      </Heading>
      <Text style={{ textAlign: 'center', fontSize: '16px' }}>
        Please click the button below to set your password and complete your account setup:
      </Text>
      <Text style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
        <EmailButton href={inviteUrl}>Accept Invite</EmailButton>
      </Text>
      <Text style={{ textAlign: 'center', fontSize: '16px' }}>
        This link will expire in 10 days.
      </Text>
      <Text style={{ textAlign: 'center', fontSize: '16px' }}>
        If you did not expect this invitation, please ignore this email.
      </Text>
    </EmailLayout>
  )
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
InviteUserEmail.PreviewProps = {
  appUrl: 'http://localhost:3000',
  inviteUrl: 'http://localhost:3000/admin/accept-invite?token=123456789',
}

export default InviteUserEmail

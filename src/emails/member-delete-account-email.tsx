import { Heading, Text } from '@react-email/components'
import EmailButton from './_components/EmailButton'
import EmailLayout from './_components/EmailLayout'

export type MemberDeleteAccountEmailProps = {
  appUrl: string
  confirmUrl: string
}

export function MemberDeleteAccountEmail({ appUrl, confirmUrl }: MemberDeleteAccountEmailProps) {
  return (
    <EmailLayout appUrl={appUrl}>
      <Heading as="h1" style={{ textAlign: 'center' }}>
        Confirm deleting your Avy account
      </Heading>
      <Text style={{ textAlign: 'center', fontSize: '16px' }}>
        This removes your account, devices and notification subscriptions across every avalanche
        center. It cannot be undone.
      </Text>
      <Text style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
        <EmailButton href={confirmUrl}>Delete my account</EmailButton>
      </Text>
      <Text style={{ textAlign: 'center', fontSize: '16px' }}>
        If you did not ask for this, ignore this email and nothing will change.
      </Text>
    </EmailLayout>
  )
}

MemberDeleteAccountEmail.PreviewProps = {
  appUrl: 'http://localhost:3000',
  confirmUrl: 'http://localhost:3000/api/auth/delete-user/callback?token=123456789',
}

export default MemberDeleteAccountEmail

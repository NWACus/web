import { Heading, Text } from '@react-email/components'
import EmailButton from './_components/EmailButton'
import EmailLayout from './_components/EmailLayout'

export type ForgotPasswordEmailProps = {
  appUrl: string
  resetUrl: string
}

export function ForgotPasswordEmail({ appUrl, resetUrl }: ForgotPasswordEmailProps) {
  return (
    <EmailLayout appUrl={appUrl}>
      <Heading as="h1" style={{ textAlign: 'center' }}>
        Reset your AvyFx password
      </Heading>
      <Text style={{ textAlign: 'center', fontSize: '16px' }}>
        You are receiving this because you (or someone else) have requested the reset of the
        password for your account.
      </Text>
      <Text style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
        <EmailButton href={resetUrl}>Reset Password</EmailButton>
      </Text>
      <Text style={{ textAlign: 'center', fontSize: '16px' }}>
        If you did not request this, please ignore this email and your password will remain
        unchanged.
      </Text>
    </EmailLayout>
  )
}

ForgotPasswordEmail.PreviewProps = {
  appUrl: 'http://localhost:3000',
  resetUrl: 'http://localhost:3000/admin/reset/123456789',
} as ForgotPasswordEmailProps

export default ForgotPasswordEmail

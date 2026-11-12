import { Heading, Text } from '@react-email/components'
import EmailLayout from './_components/EmailLayout'

export type MemberOtpEmailProps = {
  appUrl: string
  otp: string
  purpose: 'sign-in' | 'email-verification' | 'forget-password' | 'change-email'
}

const headings: Record<MemberOtpEmailProps['purpose'], string> = {
  'sign-in': 'Your Avy sign-in code',
  'email-verification': 'Verify your email for Avy',
  'forget-password': 'Your Avy verification code',
  'change-email': 'Confirm your new Avy email',
}

export function MemberOtpEmail({ appUrl, otp, purpose }: MemberOtpEmailProps) {
  return (
    <EmailLayout appUrl={appUrl}>
      <Heading as="h1" style={{ textAlign: 'center' }}>
        {headings[purpose]}
      </Heading>
      <Text style={{ textAlign: 'center', fontSize: '32px', letterSpacing: '6px' }}>{otp}</Text>
      <Text style={{ textAlign: 'center', fontSize: '16px' }}>
        This code expires in 10 minutes. If you did not request it, you can ignore this email.
      </Text>
    </EmailLayout>
  )
}

MemberOtpEmail.PreviewProps = {
  appUrl: 'http://localhost:3000',
  otp: '482913',
  purpose: 'sign-in',
}

export default MemberOtpEmail

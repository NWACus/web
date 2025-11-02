import { Heading, Text } from '@react-email/components'
import EmailLayout from './_components/EmailLayout'

export type ProviderApplicationConfirmationProps = {
  appUrl: string
  providerName: string
  applicantEmail: string
}

export function ProviderApplicationConfirmation({
  appUrl,
  providerName,
}: ProviderApplicationConfirmationProps) {
  return (
    <EmailLayout appUrl={appUrl}>
      <Heading as="h1" style={{ textAlign: 'center' }}>
        Application Received
      </Heading>
      <Text style={{ textAlign: 'center', fontSize: '16px', marginBottom: '24px' }}>
        Thank you for applying to be a listed provider on AvyFx!
      </Text>
      <Text style={{ fontSize: '16px', marginBottom: '16px' }}>
        We have received your application for <strong>{providerName}</strong> and will review it
        shortly.
      </Text>
      <Text style={{ fontSize: '16px', marginBottom: '16px' }}>
        Our team will evaluate your application and contact you within 3-5 business days with next
        steps.
      </Text>
      <Text style={{ fontSize: '16px', marginBottom: '24px' }}>
        If you have any questions in the meantime, please don{`'`}t hesitate to reach out to our
        support team.
      </Text>
      <Text style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
        Thank you for your interest in partnering with us to provide quality avalanche education.
      </Text>
    </EmailLayout>
  )
}

ProviderApplicationConfirmation.PreviewProps = {
  appUrl: 'http://localhost:3000',
  providerName: 'Mountain Safety Academy',
  applicantEmail: 'contact@mountainsafety.com',
} as ProviderApplicationConfirmationProps

export default ProviderApplicationConfirmation

import { courseTypesData } from '@/constants/courseTypes'
import { Heading, Text } from '@react-email/components'
import EmailButton from './_components/EmailButton'
import EmailLayout from './_components/EmailLayout'

export type ProviderApplicationApprovedProps = {
  appUrl: string
  providerName: string
  courseTypes: string[]
}

const courseTypeLabels = courseTypesData.reduce<Record<string, string>>((acc, cur) => {
  if (!acc[cur.value]) {
    acc[cur.value] = cur.label
  }
  return acc
}, {})

export function ProviderApplicationApproved({
  appUrl,
  providerName,
  courseTypes,
}: ProviderApplicationApprovedProps) {
  const providersUrl = `${appUrl}/providers`

  return (
    <EmailLayout appUrl={appUrl}>
      <Heading as="h1" style={{ textAlign: 'center' }}>
        Application Approved!
      </Heading>
      <Text style={{ textAlign: 'center', fontSize: '16px', marginBottom: '24px' }}>
        Congratulations! Your provider application has been approved.
      </Text>
      <Text style={{ fontSize: '16px', marginBottom: '16px' }}>
        We are excited to let you know that <strong>{providerName}</strong> has been approved and is
        now published on AvyFx!
      </Text>
      <Text style={{ fontSize: '16px', marginBottom: '16px' }}>
        Your organization is now visible to students looking for quality avalanche education
        courses.
      </Text>
      <Text style={{ fontSize: '16px', marginBottom: '16px' }}>
        <strong>You have been approved to offer the following course types:</strong>
      </Text>
      <ul style={{ fontSize: '16px', marginBottom: '24px', paddingLeft: '20px' }}>
        {courseTypes.map((type) => (
          <li key={type} style={{ marginBottom: '8px' }}>
            {courseTypeLabels[type] || type}
          </li>
        ))}
      </ul>
      <Text style={{ fontSize: '16px', marginBottom: '24px' }}>
        You are now listed on our providers page.
      </Text>
      <Text style={{ fontSize: '16px', marginBottom: '24px' }}>
        You will receive an invite to our platform to manage your events shortly.
      </Text>

      <Text style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
        <EmailButton href={providersUrl}>View Providers Page</EmailButton>
      </Text>

      <Text style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
        Thank you for partnering with us to provide quality avalanche education.
      </Text>
    </EmailLayout>
  )
}

ProviderApplicationApproved.PreviewProps = {
  appUrl: 'http://localhost:3000',
  providerName: 'Mountain Safety Academy',
  courseTypes: ['rec-1', 'rec-2', 'pro-1'],
}

export default ProviderApplicationApproved

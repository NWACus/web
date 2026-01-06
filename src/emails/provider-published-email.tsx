import { courseTypesData } from '@/constants/courseTypes'
import { Text } from '@react-email/components'
import A3EmailLayout from './_components/A3EmailLayout'
import EmailButton from './_components/EmailButton'

export type ProviderPublishedEmailProps = {
  appUrl: string
  providerName: string
  providerId: number
  courseTypes: string[]
}

const courseTypeLabels = courseTypesData.reduce<Record<string, string>>((acc, cur) => {
  if (!acc[cur.value]) {
    acc[cur.value] = cur.label
  }
  return acc
}, {})

export function ProviderPublishedEmail({
  appUrl,
  providerName,
  providerId,
  courseTypes,
}: ProviderPublishedEmailProps) {
  const providersUrl = `${appUrl}/admin/collections/providers/${providerId}`

  return (
    <A3EmailLayout appUrl={appUrl}>
      <Text style={{ fontSize: '16px', marginBottom: '16px' }}>
        We are excited to let you know that <strong>{providerName}</strong> can now publish courses
        on AvyWeb, a tool used by A3 and avalanche centers nationwide!
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
        <EmailButton href={providersUrl}>View Your Provider</EmailButton>
      </Text>

      <Text style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
        Thank you for partnering with us to provide quality avalanche education.
      </Text>
    </A3EmailLayout>
  )
}

ProviderPublishedEmail.PreviewProps = {
  appUrl: 'http://localhost:3000',
  providerName: 'Mountain Safety Academy',
  providerId: 1,
  courseTypes: ['rec-1', 'rec-2', 'pro-1'],
}

export default ProviderPublishedEmail

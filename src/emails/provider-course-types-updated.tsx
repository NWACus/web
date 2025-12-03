import { courseTypesData } from '@/constants/courseTypes'
import { Heading, Text } from '@react-email/components'
import A3EmailLayout from './_components/A3EmailLayout'
import EmailButton from './_components/EmailButton'

export type ProviderCourseTypesUpdatedProps = {
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

export function ProviderCourseTypesUpdated({
  appUrl,
  providerName,
  courseTypes,
}: ProviderCourseTypesUpdatedProps) {
  const providersUrl = `${appUrl}/providers`

  return (
    <A3EmailLayout appUrl={appUrl}>
      <Heading as="h1" style={{ textAlign: 'center' }}>
        Course Types Updated
      </Heading>
      <Text style={{ textAlign: 'center', fontSize: '16px', marginBottom: '24px' }}>
        Your approved course types have been updated.
      </Text>
      <Text style={{ fontSize: '16px', marginBottom: '16px' }}>
        The course types for <strong>{providerName}</strong> have been updated by an A3
        administrator.
      </Text>
      <Text style={{ fontSize: '16px', marginBottom: '16px' }}>
        <strong>Your current approved course types are:</strong>
      </Text>
      <ul style={{ fontSize: '16px', marginBottom: '24px', paddingLeft: '20px' }}>
        {courseTypes.map((type) => (
          <li key={type} style={{ marginBottom: '8px' }}>
            {courseTypeLabels[type] || type}
          </li>
        ))}
      </ul>
      <Text style={{ fontSize: '16px', marginBottom: '24px' }}>
        If you believe this change was made in error or have questions, please contact our support
        team.
      </Text>

      <Text style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
        <EmailButton href={providersUrl}>View Providers Page</EmailButton>
      </Text>

      <Text style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
        Thank you for partnering with us to provide quality avalanche education.
      </Text>
    </A3EmailLayout>
  )
}

ProviderCourseTypesUpdated.PreviewProps = {
  appUrl: 'http://localhost:3000',
  providerName: 'Mountain Safety Academy',
  courseTypes: ['rec-1', 'rec-2', 'pro-1'],
}

export default ProviderCourseTypesUpdated

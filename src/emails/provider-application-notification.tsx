import { eventSubTypesData } from '@/collections/Events/constants'
import { Column, Heading, Row, Section, Text } from '@react-email/components'
import EmailButton from './_components/EmailButton'
import EmailLayout from './_components/EmailLayout'

export type ProviderApplicationNotificationProps = {
  appUrl: string
  providerName: string
  providerDetails: string
  courseTypes: string[]
  email: string
  phone?: string
  website?: string
  experience?: string
  location: string
  providerId: string | number
}

const courseTypeLabels = eventSubTypesData
  .filter((subType) => subType.eventType === 'course-by-external-provider')
  .reduce<Record<string, string>>((acc, cur) => {
    if (!acc[cur.value]) {
      acc[cur.value] = cur.label
    }
    return acc
  }, {})

export function ProviderApplicationNotification({
  appUrl,
  providerName,
  providerDetails,
  courseTypes,
  email,
  phone,
  website,
  experience,
  location,
  providerId,
}: ProviderApplicationNotificationProps) {
  const adminUrl = `${appUrl}/admin/collections/providers/${providerId}`

  return (
    <EmailLayout appUrl={appUrl}>
      <Heading as="h1" style={{ textAlign: 'center' }}>
        New Provider Application
      </Heading>
      <Text style={{ fontSize: '16px', marginBottom: '12px' }}>
        A new provider has applied to be listed on the platform. Please review the details below:
      </Text>

      <Section style={{ marginBottom: '12px' }}>
        <Row>
          <Column>
            <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>Provider Name:</Text>
            <Text style={{ marginTop: '0', marginBottom: '16px' }}>{providerName}</Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>Details:</Text>
            <Text style={{ marginTop: '0', marginBottom: '16px' }}>{providerDetails}</Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>Location:</Text>
            <Text style={{ marginTop: '0', marginBottom: '16px' }}>{location}</Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>Course Types:</Text>
            <Text style={{ marginTop: '0', marginBottom: '16px' }}>
              {courseTypes.map((type) => courseTypeLabels[type] || type).join(', ')}
            </Text>
          </Column>
        </Row>

        <Row>
          <Column>
            <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>Email:</Text>
            <Text style={{ marginTop: '0', marginBottom: '16px' }}>{email}</Text>
          </Column>
        </Row>

        {phone && (
          <Row>
            <Column>
              <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>Phone:</Text>
              <Text style={{ marginTop: '0', marginBottom: '16px' }}>{phone}</Text>
            </Column>
          </Row>
        )}

        {website && (
          <Row>
            <Column>
              <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>Website:</Text>
              <Text style={{ marginTop: '0', marginBottom: '16px' }}>{website}</Text>
            </Column>
          </Row>
        )}

        {experience && (
          <Row>
            <Column>
              <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Experience/Certifications:
              </Text>
              <Text style={{ marginTop: '0', marginBottom: '16px' }}>{experience}</Text>
            </Column>
          </Row>
        )}
      </Section>

      <Text style={{ textAlign: 'center', paddingTop: '20px', paddingBottom: '20px' }}>
        <EmailButton href={adminUrl}>Review Application in Admin Panel</EmailButton>
      </Text>

      <Text style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
        This provider has been created as a draft and requires approval before being published.
      </Text>
    </EmailLayout>
  )
}

ProviderApplicationNotification.PreviewProps = {
  appUrl: 'http://localhost:3000',
  providerName: 'Mountain Safety Academy',
  providerDetails:
    'We are a professional avalanche education organization with over 15 years of experience providing high-quality avalanche safety courses.',
  courseTypes: ['rec-1', 'rec-2', 'pro-1'],
  email: 'contact@mountainsafety.com',
  phone: '555-123-4567',
  website: 'https://mountainsafety.com',
  experience: 'AIARE certified instructors with 20+ years of backcountry experience',
  location: 'Stevens Pass, WA',
  providerId: '123',
} as ProviderApplicationNotificationProps

export default ProviderApplicationNotification

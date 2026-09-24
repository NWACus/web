import { Heading, Hr, Link, Text } from '@react-email/components'
import EmailLayout from './_components/EmailLayout'

export type SharedContentSuggestionEmailProps = {
  appUrl: string
  adminUrl: string
  collectionLabel: string
  documentTitle: string
  suggesterName: string
  suggesterEmail: string
  /** The centers the suggester works for, already formatted. Empty when they hold no Role Assignment. */
  suggesterCenters: string
  suggestion: string
}

export function SharedContentSuggestionEmail({
  appUrl,
  adminUrl,
  collectionLabel,
  documentTitle,
  suggesterName,
  suggesterEmail,
  suggesterCenters,
  suggestion,
}: SharedContentSuggestionEmailProps) {
  return (
    <EmailLayout appUrl={appUrl}>
      <Heading as="h1">Suggested edit to shared content</Heading>
      <Text style={{ fontSize: '16px' }}>
        <strong>{suggesterName}</strong> ({suggesterEmail}
        {suggesterCenters ? `, ${suggesterCenters}` : ''}) suggested a change to the{' '}
        {collectionLabel} <strong>{documentTitle}</strong>.
      </Text>
      <Text style={{ fontSize: '16px' }}>
        <Link href={adminUrl}>Open it in the admin panel</Link>
      </Text>
      <Hr />
      <Text style={{ fontSize: '16px', whiteSpace: 'pre-wrap' }}>{suggestion}</Text>
      <Hr />
      <Text style={{ fontSize: '14px' }}>
        Reply to this email to reach {suggesterName} directly.
      </Text>
    </EmailLayout>
  )
}

SharedContentSuggestionEmail.PreviewProps = {
  appUrl: 'http://localhost:3000',
  adminUrl: 'http://localhost:3000/admin/collections/sharedMedia/1',
  collectionLabel: 'Shared Media',
  documentTitle: 'shared-image-mountain.png',
  suggesterName: 'NWAC Admin',
  suggesterEmail: 'admin@nwac.us',
  suggesterCenters: 'Northwest Avalanche Center',
  suggestion: 'The credit should read "Photo: Jane Doe, NWAC" rather than the center name alone.',
}

export default SharedContentSuggestionEmail

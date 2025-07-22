import { Container, Font, Head, Hr, Html, Text } from '@react-email/components'
import { ReactNode } from 'react'
import EmailLogo from './EmailLogo'

export default function EmailLayout({ appUrl, children }: { appUrl: string; children: ReactNode }) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="sans-serif"
          fallbackFontFamily="sans-serif"
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Container>
        <EmailLogo appUrl={appUrl} />
        <Hr />
        <div
          style={{
            padding: '10px 20px 20px 20px',
          }}
        >
          {children}
        </div>
        <Hr />
        <Text style={{ textAlign: 'center', fontSize: '12px' }}>
          &copy; {new Date().getFullYear()} AvyFx
        </Text>
      </Container>
    </Html>
  )
}

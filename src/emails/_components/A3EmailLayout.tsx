import { Container, Font, Head, Hr, Html, Img, Text } from '@react-email/components'
import { ReactNode } from 'react'

export default function A3EmailLayout({
  appUrl,
  children,
}: {
  appUrl: string
  children: ReactNode
}) {
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
        <div
          style={{
            paddingTop: '24px',
            paddingBottom: '20px',
            marginRight: 'auto',
            marginLeft: 'auto',
            width: 'fit-content',
            display: 'flex',
            gap: '20px',
          }}
        >
          <Img src={`${appUrl}/assets/a3-logo.png`} alt="Logo" width="auto" height="80" />
          <div
            style={{
              height: '20px',
              width: '1px',
              borderRadius: '2px',
              backgroundColor: '#142e57',
              marginTop: 'auto',
              marginBottom: 'auto',
            }}
          />
          <Img src={`${appUrl}/assets/icon.png`} alt="Logo" width="80" height="80" />
        </div>
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
          &copy; {new Date().getFullYear()} Avy
        </Text>
      </Container>
    </Html>
  )
}

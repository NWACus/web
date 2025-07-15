import { Img, Text } from '@react-email/components'

export default function EmailLogo({ appUrl }: { appUrl: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '24px',
      }}
    >
      <Img src={`${appUrl}/assets/icon.png`} alt="Logo" width="80" height="80" />
      <Text
        style={{
          fontSize: '24px',
          fontWeight: '700',
          whiteSpace: 'nowrap',
        }}
      >
        AvyFx
      </Text>
    </div>
  )
}

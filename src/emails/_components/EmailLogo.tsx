import { Img, Text } from '@react-email/components'

export default function EmailLogo({ appUrl }: { appUrl: string }) {
  return (
    <div
      style={{
        paddingTop: '24px',
        marginRight: 'auto',
        marginLeft: 'auto',
        width: 'fit-content',
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

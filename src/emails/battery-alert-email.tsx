import type { StationBattery } from '@/services/snowobs/battery'
import { Text } from '@react-email/components'
import EmailLayout from './_components/EmailLayout'

export type BatteryAlertEmailProps = {
  appUrl: string
  /** Stations that just went unhealthy. Each is muted after this sends. */
  stations: StationBattery[]
  low: number
  high?: number
}

const row: React.CSSProperties = { fontSize: '15px', marginBottom: '4px' }

function describe(station: StationBattery, low: number, high?: number): string {
  const where = station.elevation != null ? `${station.name} (${station.elevation}')` : station.name
  const bound = station.status === 'high' && high !== undefined ? `above ${high}V` : `below ${low}V`
  return `${where} — ${station.voltage}V, ${bound}`
}

export function BatteryAlertEmail({ appUrl, stations, low, high }: BatteryAlertEmailProps) {
  const range = high !== undefined ? `${low}–${high}V` : `above ${low}V`

  return (
    <EmailLayout appUrl={appUrl}>
      <Text style={{ ...row, fontWeight: 'bold', marginBottom: '12px' }}>
        {stations.length === 1
          ? 'A weather station battery is outside the healthy range:'
          : `${stations.length} weather station batteries are outside the healthy range:`}
      </Text>
      {stations.map((station) => (
        <Text key={station.stid} style={row}>
          {describe(station, low, high)}
        </Text>
      ))}
      <Text style={{ ...row, marginTop: '16px', color: '#666' }}>
        {`The healthy range is ${range}. ${stations.length === 1 ? 'This station' : 'These stations'} will not alert again until re-enabled in the admin, so this message can be kept until the repair is done.`}
      </Text>
    </EmailLayout>
  )
}

export default BatteryAlertEmail

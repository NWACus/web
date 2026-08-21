import BatteryAlertEmail, { BatteryAlertEmailProps } from '@/emails/battery-alert-email'
import { pretty, render } from '@react-email/render'
import { getURL } from '../getURL'

function subjectFor({ stations }: BatteryAlertEmailProps): string {
  // Matches the Django subject forecasters already filter on, so existing inbox
  // rules keep working across the cutover.
  if (stations.length === 1) return `Datalogger '${stations[0].name}' battery unhealthy`
  return `${stations.length} datalogger batteries unhealthy`
}

export async function generateBatteryAlertEmail(
  args: Omit<BatteryAlertEmailProps, 'appUrl'> & { appUrl?: string },
) {
  const props: BatteryAlertEmailProps = { ...args, appUrl: args.appUrl ?? getURL() }

  const [html, text] = await Promise.all([
    render(<BatteryAlertEmail {...props} />).then(pretty),
    render(<BatteryAlertEmail {...props} />, { plainText: true }),
  ])

  return { html, text, subject: subjectFor(props) }
}

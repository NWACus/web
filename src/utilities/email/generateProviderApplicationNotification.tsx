import ProviderApplicationNotification, {
  ProviderApplicationNotificationProps,
} from '@/emails/provider-application-notification'
import { pretty, render } from '@react-email/render'

export async function generateProviderApplicationNotification(
  props: ProviderApplicationNotificationProps,
) {
  const [html, text] = await Promise.all([
    render(<ProviderApplicationNotification {...props} />).then(pretty),
    render(<ProviderApplicationNotification {...props} />, {
      plainText: true,
    }),
  ])

  return { html, text, subject: 'New Provider Application Received' }
}

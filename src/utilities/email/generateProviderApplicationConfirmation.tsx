import ProviderApplicationConfirmation, {
  ProviderApplicationConfirmationProps,
} from '@/emails/provider-application-confirmation'
import { pretty, render } from '@react-email/render'

export async function generateProviderApplicationConfirmation(
  props: ProviderApplicationConfirmationProps,
) {
  const [html, text] = await Promise.all([
    render(<ProviderApplicationConfirmation {...props} />).then(pretty),
    render(<ProviderApplicationConfirmation {...props} />, {
      plainText: true,
    }),
  ])

  return { html, text, subject: 'Your Provider Application Has Been Received' }
}

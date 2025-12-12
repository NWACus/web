import ProviderPublishedEmail, {
  ProviderPublishedEmailProps,
} from '@/emails/provider-published-email'
import { pretty, render } from '@react-email/render'

export async function generateProviderPublishedEmail(props: ProviderPublishedEmailProps) {
  const [html, text] = await Promise.all([
    render(<ProviderPublishedEmail {...props} />).then(pretty),
    render(<ProviderPublishedEmail {...props} />, {
      plainText: true,
    }),
  ])

  return { html, text, subject: "You're published as an A3 provider on AvyWeb" }
}

import ProviderApplicationApproved, {
  ProviderApplicationApprovedProps,
} from '@/emails/provider-application-approved'
import { pretty, render } from '@react-email/render'

export async function generateProviderApplicationApproved(props: ProviderApplicationApprovedProps) {
  const [html, text] = await Promise.all([
    render(<ProviderApplicationApproved {...props} />).then(pretty),
    render(<ProviderApplicationApproved {...props} />, {
      plainText: true,
    }),
  ])

  return { html, text, subject: 'Your Provider Application Has Been Approved!' }
}

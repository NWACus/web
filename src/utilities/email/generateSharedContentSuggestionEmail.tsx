import SharedContentSuggestionEmail, {
  SharedContentSuggestionEmailProps,
} from '@/emails/shared-content-suggestion-email'
import { pretty, render } from '@react-email/render'

export async function generateSharedContentSuggestionEmail(
  props: SharedContentSuggestionEmailProps,
) {
  const [html, text] = await Promise.all([
    render(<SharedContentSuggestionEmail {...props} />).then(pretty),
    render(<SharedContentSuggestionEmail {...props} />, { plainText: true }),
  ])

  return {
    html,
    text,
    subject: `Suggested edit: ${props.collectionLabel} — ${props.documentTitle}`,
  }
}

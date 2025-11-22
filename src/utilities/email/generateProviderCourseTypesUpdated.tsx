import ProviderCourseTypesUpdated, {
  ProviderCourseTypesUpdatedProps,
} from '@/emails/provider-course-types-updated'
import { pretty, render } from '@react-email/render'

export async function generateProviderCourseTypesUpdated(props: ProviderCourseTypesUpdatedProps) {
  const [html, text] = await Promise.all([
    render(<ProviderCourseTypesUpdated {...props} />).then(pretty),
    render(<ProviderCourseTypesUpdated {...props} />, {
      plainText: true,
    }),
  ])

  return { html, text, subject: 'Your Provider Course Types Have Been Updated' }
}

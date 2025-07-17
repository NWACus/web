import ForgotPasswordEmail from '@/emails/forgot-password-email'
import { pretty, render } from '@react-email/render'
import { PayloadRequest, User } from 'payload'
import { formatAdminURL } from 'payload/shared'
import { getURL } from '../getURL'

export async function generateForgotPasswordEmail(
  args:
    | {
        req?: PayloadRequest
        token?: string
        user?: User
      }
    | undefined,
) {
  const { req, token } = args ?? {}

  const currentHost = req?.headers.get('host') || req?.host
  const serverURL = getURL(currentHost)
  const resetUrl = formatAdminURL({
    adminRoute: req?.payload.config.routes.admin || '/admin',
    path: `/reset/${token}`,
    serverURL,
  })

  const [html, text] = await Promise.all([
    render(<ForgotPasswordEmail resetUrl={resetUrl} appUrl={serverURL} />).then(pretty),
    render(<ForgotPasswordEmail resetUrl={resetUrl} appUrl={serverURL} />, {
      plainText: true,
    }),
  ])

  return { html, text, subject: 'Reset your AvyFx password' }
}

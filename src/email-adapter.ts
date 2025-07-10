import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'

const emailDefaultFromAddress = process.env.EMAIL_DEFAULT_FROM_ADDRESS || 'support@avy-fx.org'
const emailDefaultFromName = process.env.EMAIL_DEFAULT_FROM_NAME || 'AvyFx Support'

const smtpConfig: Record<string, string> = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
}

export function getEmailAdapter() {
  let emailAdapter
  let emailWarning

  if (process.env.NODE_ENV === 'production') {
    if (!!process.env.RESEND_API_KEY) {
      emailAdapter = resendAdapter({
        defaultFromAddress: emailDefaultFromAddress,
        defaultFromName: emailDefaultFromName,
        apiKey: process.env.RESEND_API_KEY,
      })
    } else {
      emailWarning =
        'RESEND_API_KEY is missing. Not configuring Resend email adapter. Email sending will not work.'
    }
  } else {
    if (Object.keys(smtpConfig).every((val) => !!smtpConfig[val])) {
      emailAdapter = nodemailerAdapter({
        defaultFromAddress: emailDefaultFromAddress,
        defaultFromName: emailDefaultFromName,
        transportOptions: {
          host: smtpConfig.SMTP_HOST,
          port: smtpConfig.SMTP_PORT,
          auth: {
            user: smtpConfig.SMTP_USER,
            pass: smtpConfig.SMTP_PASS,
          },
        },
      })
    } else {
      emailWarning = `Local email adapter environment variables ${Object.keys(smtpConfig)
        .filter((val) => !smtpConfig[val])
        .join(
          ', ',
        )} are missing. Not configuring nodemailer email adapter. Email sending will not work.`
    }
  }

  return {
    emailAdapter,
    emailWarning,
  }
}

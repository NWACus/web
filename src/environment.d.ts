declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URI: string
      VERCEL_BLOB_READ_WRITE_TOKEN: string
      PAYLOAD_SECRET: string
      NEXT_PUBLIC_ROOT_DOMAIN: string
      PRODUCTION_TENANTS: string
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string
      NAC_HOST: string
      AFP_HOST: string
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string
      VERCEL_BLOB_READ_WRITE_TOKEN: string
      EMAIL_DEFAULT_FROM_ADDRESS: string
      EMAIL_DEFAULT_FROM_NAME: string
      SMTP_HOST: string
      SMTP_PORT: string
      SMTP_USER: string
      SMTP_PASS: string
      RESEND_API_KEY: string
      INVITE_TOKEN_EXPIRATION_MS: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}

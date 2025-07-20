declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      NEXT_PUBLIC_ROOT_DOMAIN: string
      PRODUCTION_TENANTS: string
      NAC_HOST: string
      AFP_HOST: string
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string
      VERCEL_BLOB_READ_WRITE_TOKEN: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}

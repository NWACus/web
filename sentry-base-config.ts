const sentryBaseConfig = {
  dsn: 'https://7f836bd47bd79570fa140c3b0c60f193@o4504317391929344.ingest.us.sentry.io/4509675069702145',
  tracesSampleRate: 0.5,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.VERCEL_GIT_COMMIT_REF || 'local',
}

export default sentryBaseConfig

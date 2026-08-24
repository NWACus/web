const sentryBaseConfig = {
  dsn: 'https://7f836bd47bd79570fa140c3b0c60f193@o4504317391929344.ingest.us.sentry.io/4509675069702145',
  tracesSampleRate: 0, // effectively disables tracing
  // The mocked E2E server is a production build, so without the second clause every synthetic
  // failure the suite provokes would be reported to the real project. See
  // docs/afp-products/e2e-mocks.md.
  enabled: process.env.NODE_ENV === 'production' && !process.env.E2E_MOCK_ROLE,
  environment: process.env.VERCEL_GIT_COMMIT_REF || 'local',
}

export default sentryBaseConfig

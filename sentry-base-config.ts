const sentryBaseConfig = {
  dsn: 'https://7f836bd47bd79570fa140c3b0c60f193@o4504317391929344.ingest.us.sentry.io/4509675069702145',
  tracesSampleRate: 0, // effectively disables tracing
  // The mocked E2E server is a production build, so without the second clause every synthetic
  // failure the suite provokes would be reported to the real project. The flag has to be
  // NEXT_PUBLIC_ to reach this file's *client* copy — Next inlines only NEXT_PUBLIC_ vars into the
  // browser bundle, so an unprefixed one reads as `undefined` there and the browser SDK stays on.
  // `environment` below is the same mechanism, which is why it is always 'local' client-side.
  // See docs/afp-products/e2e-mocks.md.
  enabled: process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_E2E_MOCK_ROLE,
  environment: process.env.VERCEL_GIT_COMMIT_REF || 'local',
}

export default sentryBaseConfig

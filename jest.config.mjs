import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

// Payload and its dependencies use ESM, which Jest can't handle by default.
// next/jest hardcodes /node_modules/ in transformIgnorePatterns, so we
// override the patterns to transform all node_modules with SWC.
// See: https://github.com/vercel/next.js/issues/35634
function addEsmTransformSupport(jestConfig) {
  return {
    ...jestConfig,
    transformIgnorePatterns: ['^.+\\.module\\.(css|sass|scss)$'],
  }
}

const clientTestConfig = {
  displayName: 'client',
  testEnvironment: 'jsdom',
  clearMocks: true,
  testMatch: ['**/__tests__/client/**/*.[jt]s?(x)'],
}

const serverTestConfig = {
  displayName: 'server',
  testEnvironment: 'node',
  clearMocks: true,
  testMatch: ['**/__tests__/server/*.[jt]s?(x)'],
}

/** @type {import('jest').Config} */
const config = {
  projects: [
    addEsmTransformSupport(await createJestConfig(clientTestConfig)()),
    addEsmTransformSupport(await createJestConfig(serverTestConfig)()),
  ],
}

export default config

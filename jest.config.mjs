import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

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
    await createJestConfig(clientTestConfig)(),
    await createJestConfig(serverTestConfig)(),
  ],
}

export default config

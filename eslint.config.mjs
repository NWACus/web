import { FlatCompat } from '@eslint/eslintrc'
import { globalIgnores } from 'eslint/config'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends(
    'prettier',
    'next',
    'next/core-web-vitals',
    'next/typescript',
    'plugin:@typescript-eslint/strict',
  ),
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never',
        },
      ],
    },
  },
  {
    // next.config.ts imports these, and Next's config loader can't resolve tsconfig `@/` aliases:
    // one here fails `next build`. nextConfigLoads.server.test.ts covers any file missing from this list.
    files: [
      'src/utilities/tenancy/avalancheCenters.ts',
      'src/utilities/tenancy/centerRemotePatterns.ts',
      'src/utilities/tenancy/tenants.ts',
      'src/utilities/timezones.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/*'],
              message:
                'next.config.ts loads this file and cannot resolve `@/` aliases. Use a relative import.',
            },
          ],
        },
      ],
    },
  },
  globalIgnores(['.next/', '.next-e2e/', 'src/migrations/', 'next-env.d.ts']),
]

export default eslintConfig

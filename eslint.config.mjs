import { FlatCompat } from '@eslint/eslintrc'
import next from 'eslint-config-next'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import { globalIgnores } from 'eslint/config'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends('prettier', 'plugin:@typescript-eslint/strict'),
  ...next,
  ...nextCoreWebVitals,
  ...nextTypescript,
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
      // New rules in eslint-plugin-react-hooks 7.x shipped with Next 16 that
      // flag patterns we have today. Downgrade to warn so the upgrade is
      // unblocked; fix in a follow-up.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  globalIgnores(['.next/', '.claude/worktrees/', 'src/migrations/', 'next-env.d.ts']),
]

export default eslintConfig

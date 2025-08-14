'use client'

import { useTheme } from '@payloadcms/ui'
import { CodeEditor } from '@payloadcms/ui/elements/CodeEditor'

export function ThemedCodeDisplay({ value }: { value: string }) {
  const { theme } = useTheme()

  return (
    <CodeEditor
      value={value}
      readOnly
      theme={theme === 'dark' ? 'vs-dark' : 'vs'}
      options={{
        padding: {
          top: 10,
          bottom: 10,
        },
      }}
    />
  )
}

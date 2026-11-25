'use client'

import { IconRadioGroup, type IconRadioOption } from '@/components/IconRadioGroup'
import { useField, useForm } from '@payloadcms/ui'
import { ExternalLink, FileText } from 'lucide-react'
import type { RadioFieldClientProps } from 'payload'

type LinkType = 'internal' | 'external'

const options: IconRadioOption<LinkType>[] = [
  { value: 'internal', label: 'Internal link', icon: FileText },
  { value: 'external', label: 'External link', icon: ExternalLink },
]

export const LinkTypeRadio = ({ path, readOnly }: RadioFieldClientProps) => {
  const { disabled, value, setValue } = useField<LinkType>({ path })
  const { dispatchFields, getField } = useForm()
  const linkPath = path.replace(/\.type$/, '')

  const onChange = (next: LinkType) => {
    const isExternal = next === 'external'
    const show = { reference: !isExternal, url: isExternal, newTab: isExternal }
    // The server decides which fields show, a form refresh later. This swaps them right away.
    dispatchFields({
      type: 'UPDATE_MANY',
      formState: Object.fromEntries(
        Object.entries(show).map(([name, passesCondition]) => [
          `${linkPath}.${name}`,
          { ...getField(`${linkPath}.${name}`), passesCondition },
        ]),
      ),
    })
    setValue(next)
  }

  return (
    <IconRadioGroup
      name={path}
      label="Goes to"
      options={options}
      value={value === 'external' ? 'external' : 'internal'}
      readOnly={readOnly || disabled}
      onChange={onChange}
    />
  )
}

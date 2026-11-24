'use client'

import { useField, useForm } from '@payloadcms/ui'
import type { RadioFieldClientProps } from 'payload'

/** Swaps a nav link between picking a page and typing a web address, one field at a time. */
export const LinkTypeSwitch = ({ path }: RadioFieldClientProps) => {
  const { value, setValue } = useField<string>({ path })
  const { dispatchFields, getField } = useForm()
  const linkPath = path.replace(/\.type$/, '')
  const isExternal = value === 'external'

  const onClick = () => {
    const show = { reference: isExternal, url: !isExternal, newTab: !isExternal }
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
    setValue(isExternal ? 'internal' : 'external')
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 w-fit cursor-pointer border-0 bg-transparent p-0 text-sm underline"
    >
      {isExternal ? 'Link to a page instead' : 'Link to a web address instead'}
    </button>
  )
}

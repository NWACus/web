'use client'
import React from 'react'

import type { Option } from '@payloadcms/ui/elements/ReactSelect'
import { SelectInput } from '@payloadcms/ui'
import type { OptionObject } from 'payload'

import './index.scss'

export const TenantSelector = ({
  cookieValue,
  options,
}: {
  cookieValue?: string
  options: OptionObject[]
}) => {
  function setCookie(name: string, value?: string) {
    const expires = '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
    document.cookie = name + '=' + (value || '') + expires + '; path=/'
  }

  React.useEffect(() => {
    setCookie('payload-tenant', cookieValue)
  }, [cookieValue])

  const handleChange = React.useCallback((option: Option | Option[]) => {
    if (!option) {
      setCookie('payload-tenant', undefined)
      window.location.reload()
    } else if ('value' in option) {
      setCookie('payload-tenant', option.value as string)
      window.location.reload()
    }
  }, [])

  if (options.length > 1) {
    return (
      <div className="tenant-selector">
        <SelectInput
          label="Select a tenant"
          name="setTenant"
          onChange={handleChange}
          options={options}
          path="setTenant"
          value={cookieValue}
        />
      </div>
    )
  }

  return null
}

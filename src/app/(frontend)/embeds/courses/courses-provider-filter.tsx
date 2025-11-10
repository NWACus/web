'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type Provider = {
  id: number
  name: string
}

type Props = {
  providers: Provider[]
}

export const CoursesProviderFilter = ({ providers }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const [selectedProviders, setSelectedProviders] = useState<string[]>(() => {
    const providersParam = searchParams.get('providers')
    return providersParam ? providersParam.split(',').filter(Boolean) : []
  })

  const updateParams = useCallback(
    (newProviders: string[]) => {
      const params = new URLSearchParams(searchParams.toString())

      if (newProviders.length > 0) {
        params.set('providers', newProviders.join(','))
      } else {
        params.delete('providers')
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const toggleProvider = useCallback(
    (providerId: string) => {
      const newProviders = selectedProviders.includes(providerId)
        ? selectedProviders.filter((p) => p !== providerId)
        : [...selectedProviders, providerId]
      setSelectedProviders(newProviders)
      updateParams(newProviders)
    },
    [selectedProviders, updateParams],
  )

  const clearFilter = () => {
    setSelectedProviders([])

    const params = new URLSearchParams(searchParams.toString())
    params.delete('providers')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="border-b">
      {providers.length > 0 && (
        <div>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between py-3 cursor-pointer transition-colors"
          >
            <h3 className="font-semibold">Provider</h3>
            <div className="flex items-center gap-2">
              {selectedProviders.length > 0 && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    clearFilter()
                  }}
                  variant="ghost"
                  className="underline text-sm h-auto p-0"
                >
                  Clear
                </Button>
              )}
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
          {isOpen && (
            <ul className="flex flex-col gap-1 p-0 list-none max-h-64 overflow-y-auto pb-4">
              {providers.map((provider) => (
                <li key={provider.id}>
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => toggleProvider(String(provider.id))}
                  >
                    <Checkbox
                      id={String(provider.id)}
                      className="mr-2"
                      checked={selectedProviders.includes(String(provider.id))}
                    />
                    <Label htmlFor={String(provider.id)} className="text-md">
                      {provider.name}
                    </Label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

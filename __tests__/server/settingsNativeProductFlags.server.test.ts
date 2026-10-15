import { hasSuperAdminPermissions } from '@/access/hasSuperAdminPermissions'
import { Settings } from '@/collections/Settings'
import type { Field, NamedGroupField } from 'payload'

function getNativeProductsGroup(): NamedGroupField {
  const tabsField = Settings.fields.find((f: Field) => f.type === 'tabs')
  if (!tabsField || tabsField.type !== 'tabs') throw new Error('settings tabs not found')
  const group = tabsField.tabs
    .flatMap((tab) => tab.fields)
    .find((f: Field) => 'name' in f && f.name === 'nativeProducts')
  if (!group || group.type !== 'group' || !('name' in group))
    throw new Error('nativeProducts group not found')
  return group
}

describe('Settings nativeProducts flags', () => {
  const flags = getNativeProductsGroup().fields

  it('has flags to check', () => {
    expect(flags.length).toBeGreaterThan(0)
  })

  it.each(flags.map((f) => ['name' in f ? f.name : f.type, f]))(
    '%s is super-admin-only and confirms before turning on',
    (_name, flag) => {
      expect(flag.type).toBe('checkbox')
      if (flag.type !== 'checkbox') return
      expect(flag.defaultValue).toBe(false)
      expect(flag.access?.create).toBe(hasSuperAdminPermissions)
      expect(flag.access?.update).toBe(hasSuperAdminPermissions)
      expect(flag.admin?.components?.Field).toBe(
        '@/collections/Settings/components/NativeProductCheckbox#NativeProductCheckbox',
      )
    },
  )
})

import { BuiltInPage, Page, Post, Tenant } from '@/payload-types'

/**
 * Factory helpers that provide defaults for all required fields,
 * so tests only specify the fields they care about.
 */

export function buildBuiltInPage(fields: Partial<BuiltInPage>): BuiltInPage {
  return { id: 0, title: '', url: '', tenant: 0, updatedAt: '', createdAt: '', ...fields }
}

export function buildPage(fields: Partial<Page>): Page {
  return {
    id: 0,
    title: '',
    layout: [],
    slug: '',
    tenant: 0,
    updatedAt: '',
    createdAt: '',
    ...fields,
  }
}

export function buildTenant(fields: Partial<Tenant>): Tenant {
  return { id: 0, name: '', slug: 'dvac', updatedAt: '', createdAt: '', ...fields }
}

export function buildPost(fields: Partial<Post>): Post {
  return {
    id: 0,
    tenant: 0,
    title: '',
    content: {
      root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 },
    },
    slug: '',
    updatedAt: '',
    createdAt: '',
    ...fields,
  }
}

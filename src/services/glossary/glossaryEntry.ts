/** What `GET /api/glossary` serves, and the only shape of a Glossary Term the browser sees. */
export type GlossaryEntry = {
  term: string
  aliases: string[]
  definition: string
  link: string | null
}

/** Tags the endpoint's cached read. A glossary edit purges this and nothing else (ADR 018). */
export const GLOSSARY_CACHE_TAG = 'glossary'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isGlossaryEntry = (value: unknown): value is GlossaryEntry =>
  isRecord(value) &&
  typeof value.term === 'string' &&
  Array.isArray(value.aliases) &&
  value.aliases.every((alias) => typeof alias === 'string') &&
  typeof value.definition === 'string' &&
  (value.link === null || typeof value.link === 'string')

export const isGlossaryEntryList = (value: unknown): value is GlossaryEntry[] =>
  Array.isArray(value) && value.every(isGlossaryEntry)

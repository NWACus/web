import { LEGACY_GLOSSARY_TERMS } from '@/services/glossary/legacyGlossaryTerms'
import { GLOSSARY_TERMS } from '../../src/migrations/20261007_210124_seed_glossary_terms'

// Production got its terms from the migration; local dev gets them from the seed list. If this
// fails because the list was changed on purpose, ship the change to production in a new migration.
it('the glossary migration inlines exactly the terms the dev seed loads', () => {
  expect(GLOSSARY_TERMS).toEqual(LEGACY_GLOSSARY_TERMS)
})

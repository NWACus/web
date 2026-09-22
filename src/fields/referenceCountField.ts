import { Field } from 'payload'

/**
 * How many documents use this one. Maintained by `syncReferenceCounts` on the referencing side,
 * because the reference itself is stored there — see docs/shared-content.md.
 *
 * It exists so a shared library can be sorted and filtered by use: `referenceCount equals 0` is the
 * list of shared documents nobody has picked up yet.
 */
export const referenceCountField = (): Field => ({
  name: 'referenceCount',
  type: 'number',
  label: 'References',
  defaultValue: 0,
  admin: {
    readOnly: true,
    position: 'sidebar',
    description: 'How many documents use this, across every avalanche center. Drafts included.',
  },
})

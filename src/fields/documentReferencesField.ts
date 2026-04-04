import { Field } from 'payload'

/**
 * Reusable field definition for tracking all document references within a routable collection.
 * Populated automatically by the populateDocumentReferences beforeChange hook.
 *
 * Hidden by default — only visible when BOTH conditions are met:
 * 1. User is super admin (has global role with wildcard actions and collections)
 * 2. localStorage.getItem('showDocRefs') is truthy (opt-in via dev tools)
 */
export const documentReferencesField = (): Field => ({
  name: 'documentReferences',
  type: 'array',
  access: {
    update: () => false,
  },
  admin: {
    readOnly: true,
    disabled: true,
    condition: (_data, _siblingData, { user }) => {
      if (!user) return false

      // Check for super admin: global role with wildcard rules
      const globalAssignments = user.globalRoleAssignments?.docs
      if (!Array.isArray(globalAssignments)) return false

      const hasSuperAdmin = globalAssignments.some((assignment) => {
        if (typeof assignment === 'number') return false
        const globalRole = assignment.globalRole
        if (!globalRole || typeof globalRole === 'number') return false
        if (!Array.isArray(globalRole.rules)) return false

        return globalRole.rules.some(
          (rule) =>
            rule.actions.some((a: string) => a === '*') &&
            rule.collections.some((c: string) => c === '*'),
        )
      })

      if (!hasSuperAdmin) return false

      // Opt-in via dev tools: localStorage.setItem('showDocRefs', '1')
      try {
        return Boolean(localStorage.getItem('showDocRefs'))
      } catch {
        return false
      }
    },
  },
  fields: [
    { name: 'collection', type: 'text' },
    { name: 'docId', type: 'number' },
    { name: 'blockType', type: 'text' },
    { name: 'fieldPath', type: 'text' },
  ],
})

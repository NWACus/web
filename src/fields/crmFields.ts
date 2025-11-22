import { GroupField } from 'payload'

export const crmFields = (): GroupField => ({
  type: 'group',
  label: 'CRM Info',
  admin: {
    position: 'sidebar',
  },
  fields: [
    {
      name: 'crmId',
      label: 'CRM ID',
      type: 'text',
      admin: {
        description: "Maps this type to it's associated representation in the CRM Integration",
      },
    },
    {
      name: 'crmIntegration',
      label: 'CRM Integration',
      type: 'select',
      options: [
        { label: 'AC Salesforce', value: 'ac-salesforce' },
        { label: 'A3 CRM', value: 'a3-crm' },
      ],
    },
  ],
})

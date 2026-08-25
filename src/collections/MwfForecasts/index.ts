import { accessByTenantRole } from '@/access/byTenantRole'
import { filterByTenant } from '@/access/filterByTenant'
import { contentHashField } from '@/fields/contentHashField'
import { tenantField } from '@/fields/tenantField'
import { getTenantFilter } from '@/utilities/collectionFilters'
import { CollectionConfig, TextFieldValidation } from 'payload'
import { enforceWorkflowInvariants, guardDelete } from './hooks/workflowGuards'

// Service dates are stored as plain YYYY-MM-DD strings so that the
// (tenant, serviceDate, issuance) workflow queries match exactly with no
// timezone ambiguity — an MWF service date is a calendar day, not an instant.
const validateServiceDate: TextFieldValidation = (value) => {
  if (!value) return 'Service date is required'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Service date must be formatted YYYY-MM-DD'
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return `${value} is not a valid calendar date`
  }
  return true
}

// Mountain Weather Forecasts. Storage for the natively-authored MWF product:
// typed top-level fields for everything the publish workflow queries on, and a
// single JSON body holding the seven content sections. Published rows are
// immutable and corrections form a supersedes chain — those semantics arrive
// with the workflow hooks; this collection is the storage scaffold. The
// product is gated per-tenant by the Settings native products feature flag.
export const MwfForecasts: CollectionConfig = {
  slug: 'mwfForecasts',
  access: accessByTenantRole('mwfForecasts'),
  labels: {
    singular: 'Mountain Weather Forecast',
    plural: 'Mountain Weather Forecasts',
  },
  admin: {
    baseListFilter: filterByTenant,
    group: 'Forecasts',
    useAsTitle: 'serviceDate',
    defaultColumns: ['serviceDate', 'issuance', 'status', 'revision', 'author'],
  },
  indexes: [
    // The workflow resolves chain heads and enforces the publish guard by
    // (tenant, serviceDate, issuance); uniqueness at publish is enforced in
    // hooks, not here, because draft and superseded rows share the slot.
    { fields: ['tenant', 'serviceDate', 'issuance'] },
  ],
  hooks: {
    beforeChange: [enforceWorkflowInvariants],
    beforeDelete: [guardDelete],
  },
  fields: [
    tenantField(),
    {
      name: 'serviceDate',
      type: 'text',
      required: true,
      index: true,
      validate: validateServiceDate,
      admin: {
        placeholder: '2026-12-31',
        description: 'The calendar day this forecast is for, formatted YYYY-MM-DD',
      },
    },
    {
      name: 'issuance',
      type: 'select',
      required: true,
      options: [
        { label: 'Morning', value: 'morning' },
        { label: 'Afternoon', value: 'afternoon' },
      ],
      admin: {
        description: 'Which issuance slot of the service date this forecast fills',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Withdrawn', value: 'withdrawn' },
      ],
    },
    {
      name: 'revision',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Increments with each correction of a published forecast; 0 is the original',
      },
    },
    {
      name: 'supersedes',
      type: 'relationship',
      relationTo: 'mwfForecasts',
      filterOptions: getTenantFilter,
      admin: {
        description:
          'The published revision this correction replaces. Corrections stay pinned to the parent’s service date and issuance slot.',
      },
    },
    {
      name: 'issuedAt',
      type: 'date',
      index: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'When this revision goes (or went) live. A future time embargoes a scheduled publish.',
      },
    },
    {
      name: 'withdrawnAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'Set when a published forecast is withdrawn; withdrawn rows are hidden, not deleted.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'The forecaster who authored this revision',
      },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'native',
      options: [
        { label: 'Native', value: 'native' },
        { label: 'Django archive import', value: 'django-import' },
      ],
      admin: {
        description: 'Provenance: authored here, or imported from the legacy Django archive',
      },
    },
    {
      name: 'body',
      type: 'json',
      admin: {
        description: 'The forecast content sections, written by the MWF editor',
      },
    },
    {
      name: 'publishSnapshot',
      type: 'json',
      admin: {
        description:
          'The tenant’s MWF config and the product structure frozen at publish time, so archived forecasts render exactly as published regardless of later config changes',
      },
    },
    contentHashField(),
  ],
}

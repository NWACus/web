// Storage-boundary enforcement of the MWF workflow invariants. The workflow
// module (utilities/mwf/workflow) is the intended write path; these hooks
// make the invariants hold no matter how a write arrives (admin UI, REST,
// stray local-API call):
//   - published rows are immutable; withdrawn rows are terminal
//   - the draft → published transition only happens through the workflow's
//     guarded publish (marked by its context flag)
//   - correction drafts stay pinned to their parent's slot
//   - only drafts hard-delete
// The archive importer marks its writes with context.mwfImport to insert
// already-published historical rows.
import { MwfForecast } from '@/payload-types'
import { APIError, CollectionBeforeChangeHook, CollectionBeforeDeleteHook } from 'payload'

const relationId = (rel: number | { id: number } | null | undefined): number | null => {
  if (rel == null) return null
  return typeof rel === 'number' ? rel : rel.id
}

export const enforceWorkflowInvariants: CollectionBeforeChangeHook<MwfForecast> = async ({
  data,
  originalDoc,
  operation,
  req,
  context,
}) => {
  const workflowWrite = context?.mwfWorkflow === true
  const importWrite = context?.mwfImport === true

  if (operation === 'create') {
    if (!importWrite && data.status && data.status !== 'draft') {
      throw new APIError(
        'New MWF forecasts start as drafts — publish through the MWF publish flow',
        400,
      )
    }
    const supersedesId = relationId(data.supersedes)
    if (supersedesId != null) {
      const parent = await req.payload.findByID({
        collection: 'mwfForecasts',
        id: supersedesId,
        depth: 0,
        req,
      })
      if (!parent || parent.status !== 'published') {
        throw new APIError('A correction must supersede a published forecast', 400)
      }
      if (data.tenant != null && relationId(parent.tenant) !== relationId(data.tenant)) {
        throw new APIError('A correction must belong to the same center as its parent', 400)
      }
      // Pinned slot: issuance and service date always inherit from the parent
      // so a correction can never drift into another AM/PM slot.
      data.issuance = parent.issuance
      data.serviceDate = parent.serviceDate
      data.revision = parent.revision + 1
    }
    return data
  }

  if (!originalDoc) return data

  if (originalDoc.status === 'withdrawn') {
    throw new APIError('Withdrawn MWF forecasts are immutable', 400)
  }

  if (originalDoc.status === 'published') {
    if (!workflowWrite) {
      throw new APIError(
        'Published MWF forecasts are immutable — editing one creates a correction draft',
        400,
      )
    }
    return data
  }

  // originalDoc is a draft.
  if (data.status && data.status !== 'draft' && !workflowWrite && !importWrite) {
    throw new APIError('Publish MWF drafts through the MWF publish flow', 400)
  }
  const supersedesId = relationId(data.supersedes ?? originalDoc.supersedes)
  if (supersedesId != null) {
    const parent = await req.payload.findByID({
      collection: 'mwfForecasts',
      id: supersedesId,
      depth: 0,
      req,
    })
    if (parent) {
      // A correction draft stays pinned across every autosave — issuance and
      // service date come from the parent, never the client payload.
      data.issuance = parent.issuance
      data.serviceDate = parent.serviceDate
      data.revision = parent.revision + 1
    }
  }
  return data
}

export const guardDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const doc = await req.payload.findByID({
    collection: 'mwfForecasts',
    id,
    depth: 0,
    req,
  })
  if (doc && doc.status !== 'draft') {
    throw new APIError(
      'Published MWF forecasts are withdrawn, not deleted — only drafts can be deleted',
      400,
    )
  }
}

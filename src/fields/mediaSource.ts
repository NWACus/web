import { isRecord } from '@/utilities/isRecord'
import type { Field, UploadFieldSingleValidation } from 'payload'

type MediaSourceOptions = {
  /** Name of the slot's existing upload field, which points at the center's own Media. */
  name: string
  /** Radio field name. Override on a block with more than one image slot. */
  sourceName?: string
  /** Shared upload field name. Override on a block with more than one image slot. */
  sharedName?: string
}

const isShared = (siblingData: unknown, sourceName: string): boolean =>
  isRecord(siblingData) && siblingData[sourceName] === 'shared'

const requireWhenSelected = (
  sourceName: string,
  wantShared: boolean,
  message: string,
): UploadFieldSingleValidation => {
  return (value, { siblingData }) => {
    if (isShared(siblingData, sourceName) !== wantShared) return true
    return value == null ? message : true
  }
}

/**
 * Turns one image slot into a choice between a center's own Media and the Shared Media library.
 * A slot with no source value means the center's library, so existing content needs no backfill
 * — see docs/decisions/022-shared-content.md, decision 5.
 */
export function mediaSourceFields({
  name,
  sourceName = 'source',
  sharedName = 'sharedMedia',
}: MediaSourceOptions): Field[] {
  return [
    {
      name: sourceName,
      type: 'radio',
      defaultValue: 'center',
      options: [
        { label: 'Center library', value: 'center' },
        { label: 'Shared library', value: 'shared' },
      ],
      admin: {
        layout: 'horizontal',
        description:
          'The shared library holds photos and videos that every avalanche center can use.',
      },
    },
    {
      name,
      type: 'upload',
      relationTo: 'media',
      // Required through validate rather than `required`, so the half of the slot that is
      // hidden never blocks a save.
      required: false,
      validate: requireWhenSelected(sourceName, false, 'Please choose an image from your library.'),
      admin: {
        condition: (_, siblingData) => !isShared(siblingData, sourceName),
      },
    },
    {
      name: sharedName,
      type: 'upload',
      relationTo: 'sharedMedia',
      required: false,
      validate: requireWhenSelected(
        sourceName,
        true,
        'Please choose an image from the shared library.',
      ),
      admin: {
        condition: (_, siblingData) => isShared(siblingData, sourceName),
      },
    },
  ]
}

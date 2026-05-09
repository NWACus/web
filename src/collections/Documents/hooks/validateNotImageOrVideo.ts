import { APIError, CollectionConfig } from 'payload'

type BeforeOperationHook = Exclude<
  Exclude<CollectionConfig['hooks'], undefined>['beforeOperation'],
  undefined
>[number]

export const validateNotImageOrVideo: BeforeOperationHook = ({ operation, req }) => {
  if ((operation !== 'create' && operation !== 'update') || !req.file) {
    return
  }

  const { mimetype } = req.file

  if (mimetype.startsWith('image/') || mimetype.startsWith('video/')) {
    throw new APIError(
      'Images and videos must be uploaded to the Media collection, not Documents.',
      400,
      null,
      true,
    )
  }
}

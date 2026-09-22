import { CollectionConfig } from 'payload'

type BeforeOperationHook = Exclude<
  Exclude<CollectionConfig['hooks'], undefined>['beforeOperation'],
  undefined
>[number]

// Media and SharedMedia share one blob prefix per environment, and a tenant's files are kept
// apart only by their slug prefix. Shared files need a prefix of their own to stay out of the way.
export const prefixSharedFilename: BeforeOperationHook = async ({ operation, req }) => {
  if ((operation !== 'create' && operation !== 'update') || !req.file) {
    return
  }

  req.file.name = `shared-` + req.file.name

  // Admin uploads go straight from the browser to blob storage (clientUploads: true)
  // under the original filename, and since Payload 3.82 the cloud-storage plugin skips
  // the server-side upload for any file that still carries clientUploadContext. Left
  // alone, the renamed document would point at a blob that was never written. Dropping
  // the context makes the plugin upload req.file.data under the prefixed name.
  if ('clientUploadContext' in req.file) {
    delete req.file.clientUploadContext
  }
}

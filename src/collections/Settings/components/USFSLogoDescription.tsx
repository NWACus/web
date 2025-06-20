import { UploadFieldDescriptionServerComponent } from 'payload'

export const USFSLogoDescription: UploadFieldDescriptionServerComponent = () => {
  return (
    <p className="field-description field-description-description">
      Upload your USFS logo if applicable. This will be displayed to the right of your banner logo.
      Please follow the{' '}
      <a
        href="https://www.fs.usda.gov/sites/default/files/fs_media/fs_document/Branding-Standards.pdf"
        target="_blank"
        className="mx-1"
      >
        USFS Branding Guidelines
      </a>{' '}
      to determine the correct logo to use.
    </p>
  )
}

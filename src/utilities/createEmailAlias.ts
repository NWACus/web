interface CreateEmailAliasOptions {
  plusAddress: string | number
  plusAddressPrefix?: string
  baseAddress?: string
}

export function createEmailAlias({
  plusAddress,
  plusAddressPrefix,
  baseAddress = 'developer@nwac.us',
}: CreateEmailAliasOptions): string {
  // Converts any input (email, number, string) into a plus-addressed alias format
  // Example: user@example.com -> developer+user-example-com@nwac.us
  // Example: 12345 -> developer+12345@nwac.us
  // All special characters are replaced with dashes and converted to lowercase
  const cleanedInput = String(plusAddress)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace special chars (including @) with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes

  const targetEmailParts = baseAddress.split('@')

  // Build the plus address suffix
  const components = []
  if (plusAddressPrefix) components.push(plusAddressPrefix)
  if (cleanedInput) components.push(cleanedInput)

  // Handle edge case where no components exist
  if (components.length === 0) {
    return `${targetEmailParts[0]}+@${targetEmailParts[1]}`
  }

  return `${targetEmailParts[0]}+${components.join('-')}@${targetEmailParts[1]}`
}

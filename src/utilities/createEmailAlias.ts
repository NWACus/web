export function createEmailAlias(
  originalEmail: string,
  targetAddress: string = 'developer@nwac.us',
): string {
  // Converts an email address into a plus-addressed alias format
  // Example: user@example.com -> developer+user-example-com@nwac.us
  // Special characters are replaced with dashes and converted to lowercase for consistency
  const emailParts = originalEmail.split('@')
  const cleanedUsername = emailParts[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace special chars with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes

  const cleanedDomain = emailParts[1]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace special chars with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/^-|-$/g, '') // Remove leading/trailing dashes

  const targetEmailParts = targetAddress.split('@')

  // Handle edge case where both username and domain are empty after cleaning
  if (!cleanedUsername && !cleanedDomain) {
    return `${targetEmailParts[0]}+@${targetEmailParts[1]}`
  }
  if (!cleanedUsername) {
    return `${targetEmailParts[0]}+${cleanedDomain}@${targetEmailParts[1]}`
  }
  if (!cleanedDomain) {
    return `${targetEmailParts[0]}+${cleanedUsername}@${targetEmailParts[1]}`
  }

  return `${targetEmailParts[0]}+${cleanedUsername}-${cleanedDomain}@${targetEmailParts[1]}`
}

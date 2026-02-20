export const getAuthorInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.substring(0, 1))
    .join('')

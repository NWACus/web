import type { FieldHook } from 'payload'

export const setNotificationEmail: FieldHook = ({ data, value }) => {
  // If notificationEmail is not set, default to the email field value
  if (!value && data?.email) {
    return data.email
  }
  return value
}

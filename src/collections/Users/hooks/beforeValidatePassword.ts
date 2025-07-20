import { validateStrongPassword } from '@/utilities/passwordValidation'
import { CollectionBeforeValidateHook } from 'payload'

export const beforeValidatePassword: CollectionBeforeValidateHook = async (args) => {
  const { data, operation } = args

  /**
   * Since we block access to the built-in create operation in the users collection access control,
   * the only time operation will be 'create' is during the invite user flow.
   *
   * Ignore password validation for invitations because passwords are generated using uuid()
   */
  if (
    process.env.NODE_ENV === 'production' &&
    typeof data?.password === 'string' &&
    operation !== 'create'
  ) {
    const result = validateStrongPassword(data.password)
    if (result !== true) {
      throw new Error(result)
    }
  }

  return data
}

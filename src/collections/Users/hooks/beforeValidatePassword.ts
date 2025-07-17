import { validateStrongPassword } from '@/utilities/passwordValidation'
import { CollectionBeforeValidateHook } from 'payload'

export const beforeValidatePassword: CollectionBeforeValidateHook = async (args) => {
  const { data } = args

  if (process.env.NODE_ENV === 'production' && typeof data?.password === 'string') {
    const result = validateStrongPassword(data.password)
    if (result !== true) {
      throw new Error(result)
    }
  }

  return data
}

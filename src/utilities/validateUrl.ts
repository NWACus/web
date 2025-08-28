import { TextFieldSingleValidation } from 'payload'
import isAbsoluteUrl from './isAbsoluteUrl'

export const validateExternalUrl: TextFieldSingleValidation = (val) =>
  isAbsoluteUrl(val) || 'URL must be an absolute url with a protocol. I.e. https://www.example.com.'

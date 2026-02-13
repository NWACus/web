import type { Form } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

export const formBlock = (form: Form): RequiredDataFromCollectionSlug<'pages'>['layout'][0] => ({
  blockType: 'formBlock',
  form: form.id,
  enableIntro: false,
  blockName: null,
})

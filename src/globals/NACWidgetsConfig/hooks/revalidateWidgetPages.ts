import { revalidatePath, revalidateTag } from 'next/cache'
import type { GlobalAfterChangeHook } from 'payload'

const revalidateWidgetPages: GlobalAfterChangeHook = async ({ doc, req: { context } }) => {
  if (context.disableRevalidate) return

  // revalidate pages that use the widget config
  revalidatePath('/[center]', 'page')
  revalidatePath('/[center]/forecasts/avalanche', 'page')
  revalidatePath('/[center]/forecasts/avalanche/[zone]', 'page')
  revalidatePath('/[center]/stations/map', 'page')

  // revalidate the unstable_cache tag for the widget config
  revalidateTag('global_nacWidgetsConfig')
}

export default revalidateWidgetPages

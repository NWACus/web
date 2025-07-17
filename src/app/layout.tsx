import { getURL } from '@/utilities/getURL'
import { Metadata } from 'next'

type Args = {
  children: React.ReactNode
}

export default async function GlobalLayout({ children }: Args) {
  return <>{children}</>
}

export const metadata: Metadata = {
  title: 'Avy - Not Found',
  description: "Looks like you're in unknown terrain. Couldn't find that page.",
  metadataBase: new URL(getURL()),
}

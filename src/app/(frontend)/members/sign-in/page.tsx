import { MemberSignIn } from '@/components/Members/MemberSignIn'

export const dynamic = 'force-dynamic'

/** Apex-only Member sign-in (ADR 026). Center hosts link here through the site-session hand-off. */
export default async function MemberSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams
  return <MemberSignIn returnTo={returnTo} />
}

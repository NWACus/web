import { AVALANCHE_ORG_URL } from './AvalancheOrgSection'
import { LinkList } from './LinkList'

const LINKS = [
  { href: '/admin', label: 'Admin panel' },
  {
    href: 'https://avy-fx.notion.site/Avy-3205af40f19880efb0a5f5910a9cbdb4',
    label: 'Avy documentation',
  },
  { href: AVALANCHE_ORG_URL, label: 'avalanche.org' },
]

/** Utility links for the people who run AvyWeb, kept out of the way at the bottom of the page. */
export function LandingFooter() {
  return (
    <footer className="border-t border-[#dde5ee]">
      <div className="container flex flex-col gap-4 py-10 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <span className="font-bold text-[#14213d]">AvyWeb</span>
        <nav aria-label="Footer">
          <LinkList links={LINKS} linkClassName="hover:text-[#14213d] hover:underline" />
        </nav>
      </div>
    </footer>
  )
}

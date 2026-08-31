import { AnnouncementBannerProvider } from '@/providers/AnnouncementBannerProvider'
import { getCachedActiveAnnouncements } from '@/utilities/queries/getActiveAnnouncements'
import { AnnouncementBanners } from './AnnouncementBanners.client'
import { AnnouncementPopup } from './AnnouncementPopup.client'

interface AnnouncementsProps {
  center: string
  children?: React.ReactNode
}

export async function Announcements({ center, children }: AnnouncementsProps) {
  const { banners, popups } = await getCachedActiveAnnouncements(center)()

  return (
    <AnnouncementBannerProvider count={banners.length}>
      {/* Below lg the banners pin to the top of the viewport along with the header, so an expanded
          announcement stays readable wherever you are on the page. This wrapper is the sticky
          element rather than the header itself: a sticky child only stays put while its containing
          block is in view, and neither the banners nor the header is much taller than its own box.
          Above lg the header isn't sticky either, and the collapsed pill scrolls you back up.

          It is also where `data-print-hide` goes, rather than on the banners: the print stylesheet
          takes the site's `<header>` chrome out, and the banners are its sibling here, not its
          child. Marking the strip that holds both is what keeps them from separating. */}
      <div
        data-print-hide
        className="sticky top-[var(--admin-bar-height,0px)] z-50 lg:static lg:z-auto"
      >
        {banners.length > 0 && <AnnouncementBanners banners={banners} />}
        {children}
      </div>
      {popups.length > 0 && <AnnouncementPopup popups={popups} center={center} />}
    </AnnouncementBannerProvider>
  )
}

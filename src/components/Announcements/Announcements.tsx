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
      {banners.length > 0 && <AnnouncementBanners banners={banners} />}
      {popups.length > 0 && <AnnouncementPopup popups={popups} center={center} />}
      {children}
    </AnnouncementBannerProvider>
  )
}

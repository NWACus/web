import { getCachedActiveAnnouncements } from '@/utilities/queries/getActiveAnnouncements'
import { AnnouncementBanners } from './AnnouncementBanners.client'
import { AnnouncementPopup } from './AnnouncementPopup.client'

interface AnnouncementsProps {
  center: string
}

export async function Announcements({ center }: AnnouncementsProps) {
  const { banners, popups } = await getCachedActiveAnnouncements(center)()

  return (
    <>
      {banners.length > 0 && <AnnouncementBanners banners={banners} />}
      {popups.length > 0 && <AnnouncementPopup popup={popups[0]} center={center} />}
    </>
  )
}

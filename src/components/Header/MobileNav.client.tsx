'use client'
import { Media } from '@/payload-types'
import { useAnnouncementBanners } from '@/providers/AnnouncementBannerProvider'
import { getImageWidthFromMaxHeight } from '@/utilities/getImageWidthFromMaxHeight'
import { cn } from '@/utilities/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog'
import { Megaphone, MegaphoneOff } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import invariant from 'tiny-invariant'
import { ImageMedia } from '../Media/ImageMedia'
import { Accordion } from '../ui/accordion'
import { MobileNavItem } from './MobileNavItem'
import { TopLevelNavItem } from './utils'

export const MobileNav = ({
  topLevelNavItems,
  banner,
  usfsLogo,
}: {
  topLevelNavItems: TopLevelNavItem[]
  banner?: Media
  usfsLogo?: Media | null
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(64) // fallback to the expected height of the mobile nav bar
  const headerRef = useRef<HTMLDivElement>(null)
  const { count: announcementCount, collapsed, toggle } = useAnnouncementBanners()

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect()
        setHeaderHeight(rect.bottom)
      }
    }

    updateHeaderHeight()

    if (!mobileNavOpen) return

    // The open menu hangs off the bottom of the header, so its offset has to survive anything that
    // moves the header while it's open: an orientation change, the announcement banners animating
    // open or closed, the sticky header pinning as the page scrolls. Measuring on a frame covers
    // all of them, and only runs for as long as the menu is open.
    let frame = requestAnimationFrame(function trackHeaderHeight() {
      updateHeaderHeight()
      frame = requestAnimationFrame(trackHeaderHeight)
    })

    return () => cancelAnimationFrame(frame)
  }, [mobileNavOpen])

  useEffect(
    function manageScrollLock() {
      if (mobileNavOpen) {
        document.body.style.overflow = 'hidden'

        return () => {
          document.body.style.overflow = 'unset'
        }
      }
    },
    [mobileNavOpen],
  )

  return (
    <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen} modal={false}>
      <div ref={headerRef} className="lg:hidden py-1.5 bg-header shadow-sm">
        {/* Three tracks so the logo stays centered whether or not the announcements toggle is
            rendered. The outer tracks are equal by definition, empty or not. */}
        <div className="container grid grid-cols-[1fr_auto_1fr] items-center gap-5">
          <DialogTrigger className="col-start-1 justify-self-start p-2">
            <div className="flex w-6 h-6 flex-col items-center justify-center space-y-[5px] overflow-hidden outline-none">
              <span
                className={`bg-header-foreground h-[2px] w-full rounded transition-all duration-300 ease-in-out ${
                  mobileNavOpen ? 'translate-x-full' : ''
                }`}
              ></span>
              <span
                className={`bg-header-foreground h-[2px] w-full rounded transition-all duration-300 ease-in-out ${
                  mobileNavOpen ? 'mx-auto rotate-45' : ''
                }`}
              ></span>
              <span
                className={`bg-header-foreground h-[2px] w-full  rounded transition-all duration-300 ease-in-out ${
                  mobileNavOpen ? 'mx-auto -translate-y-[7px] -rotate-45' : ''
                }`}
              ></span>
            </div>
            <span className="sr-only">Toggle menu</span>
          </DialogTrigger>
          {banner && (
            <Link href="/" className="col-start-2 justify-self-center w-fit flex gap-4">
              <ImageMedia
                resource={banner}
                loading="eager"
                priority={true}
                imgClassName="h-[36px] object-contain w-fit"
                sizes={getImageWidthFromMaxHeight(banner, 36)}
              />
              {usfsLogo && (
                <ImageMedia
                  resource={usfsLogo}
                  loading="eager"
                  priority={true}
                  imgClassName="h-[36px] object-contain w-fit"
                  sizes={getImageWidthFromMaxHeight(usfsLogo, 36)}
                />
              )}
            </Link>
          )}
          {announcementCount > 0 && (
            <button
              onClick={toggle}
              className={cn(
                'col-start-3 justify-self-end relative rounded-md p-2 text-header-foreground transition-colors',
                !collapsed && 'bg-header-foreground/20',
              )}
              aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${announcementCount} ${announcementCount === 1 ? 'announcement' : 'announcements'}`}
              aria-expanded={!collapsed}
            >
              {collapsed ? <Megaphone className="h-5 w-5" /> : <MegaphoneOff className="h-5 w-5" />}
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-callout px-1 text-[10px] font-bold text-callout-foreground">
                {announcementCount}
              </span>
            </button>
          )}
        </div>
      </div>
      <DialogPortal>
        <div
          className={cn('lg:hidden fixed inset-0', mobileNavOpen && 'pointer-events-none')}
          onClick={() => setMobileNavOpen(false)}
        />
        <DialogContent
          className="lg:hidden overflow-y-auto fixed z-40 bg-header text-header-foreground pb-2 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-x-0 border-b border-b-header-foreground-highlight data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top"
          style={{ top: `${headerHeight}px`, maxHeight: `calc(100dvh - ${headerHeight}px)` }}
        >
          <DialogTitle className="sr-only">menu</DialogTitle>
          <DialogDescription className="sr-only">navigation menu</DialogDescription>
          <Accordion type="single" collapsible asChild>
            <nav className="divide-y divide-header-foreground/20 px-2 sm:container">
              {topLevelNavItems.map((navItem, index) => {
                const label = navItem.label ?? navItem.link?.label

                invariant(label, `Missing a label for top level nav item ${index}`)

                return (
                  <MobileNavItem
                    key={label}
                    label={label}
                    navItem={{
                      id: label,
                      link: navItem.link,
                      items: navItem.items,
                    }}
                    displayMode={navItem.displayMode}
                    setMobileNavOpen={setMobileNavOpen}
                  />
                )
              })}
            </nav>
          </Accordion>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

'use client'
import { Media } from '@/payload-types'
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
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import invariant from 'tiny-invariant'
import { ImageMedia } from '../Media/ImageMedia'
import { Accordion } from '../ui/accordion'
import { Button } from '../ui/button'
import { MobileNavItem } from './MobileNavItem'
import { RenderNavLink } from './RenderNavLink'
import { TopLevelNavItem } from './utils'

export const MobileNav = ({
  topLevelNavItems,
  donateNavItem,
  banner,
  usfsLogo,
}: {
  topLevelNavItems: TopLevelNavItem[]
  donateNavItem?: TopLevelNavItem
  banner?: Media
  usfsLogo?: Media | null
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(64) // fallback to the expected height of the mobile nav bar
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const rect = headerRef.current.getBoundingClientRect()
        setHeaderHeight(rect.bottom)
      }
    }

    updateHeaderHeight()

    window.addEventListener('resize', updateHeaderHeight)

    return () => {
      window.removeEventListener('resize', updateHeaderHeight)
    }
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
      <div ref={headerRef} className="lg:hidden fixed z-50 inset-x-0 py-1.5 bg-header shadow-sm">
        <div className="container flex justify-between items-center gap-5">
          <DialogTrigger className="p-2">
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
            <Link href="/" className="w-fit flex gap-4">
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
          {donateNavItem && (
            // TODO
            <RenderNavLink link={donateNavItem.link} onClick={() => setMobileNavOpen(false)}>
              <Button variant="callout">{donateNavItem.label}</Button>
            </RenderNavLink>
          )}
        </div>
      </div>
      <DialogPortal>
        <div
          className={cn('lg:hidden fixed inset-0', mobileNavOpen && 'pointer-events-none')}
          onClick={() => setMobileNavOpen(false)}
        />
        <DialogContent
          className="lg:hidden max-h-[calc(100vh-64px)] overflow-y-auto fixed z-40 bg-header text-header-foreground pb-2 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-x-0 border-b border-b-header-foreground-highlight data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top"
          style={{ top: `${headerHeight}px` }}
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

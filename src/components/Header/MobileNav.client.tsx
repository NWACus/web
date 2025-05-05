'use client'
import { Media } from '@/payload-types'
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
}: {
  topLevelNavItems: TopLevelNavItem[]
  donateNavItem?: TopLevelNavItem
  banner?: Media
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const navbarRef = useRef<HTMLDivElement | null>(null)

  useEffect(
    function manageScrollLock() {
      if (mobileNavOpen) {
        const scrollY = window.scrollY

        document.body.style.position = 'fixed'
        document.body.style.top = `-${scrollY}px`
        document.body.style.width = '100%'
        document.body.style.overflow = 'hidden'

        return () => {
          document.body.style.position = ''
          document.body.style.top = ''
          document.body.style.width = ''
          document.body.style.overflow = ''

          window.scrollTo(0, scrollY)
        }
      }
    },
    [mobileNavOpen],
  )

  return (
    <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen} modal={false}>
      <div ref={navbarRef} className="lg:hidden fixed z-50 inset-x-0 py-3 bg-header shadow-md">
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
            <Link href="/" className="w-fit">
              <ImageMedia
                resource={banner}
                loading="eager"
                priority={true}
                imgClassName="h-[36px] object-contain w-fit"
              />
            </Link>
          )}
          {donateNavItem && (
            <RenderNavLink link={donateNavItem.link} onClick={() => setMobileNavOpen(false)}>
              <Button variant="callout">{donateNavItem.label}</Button>
            </RenderNavLink>
          )}
        </div>
      </div>
      <DialogPortal>
        <div
          className={cn('md:hidden fixed inset-0', mobileNavOpen && 'pointer-events-none')}
          onClick={() => setMobileNavOpen(false)}
        />
        <DialogContent className="md:hidden max-h-[calc(100vh-64px)] overflow-y-auto fixed z-40 bg-header text-header-foreground pb-2 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-x-0 top-[64px] border-b border-b-white data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top">
          <DialogTitle className="sr-only">menu</DialogTitle>
          <DialogDescription className="sr-only">navigation menu</DialogDescription>
          <Accordion type="single" collapsible asChild>
            <nav className="divide-y divide-header-foreground/20 px-2">
              {topLevelNavItems.map((navItem) => {
                const label = navItem.label ?? navItem.link?.label

                if (!label) return null

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

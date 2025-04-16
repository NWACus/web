'use client'
import { Media, Navigation, Page, Post } from '@/payload-types'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/cn'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ImageMedia } from '../Media/ImageMedia'
import { Accordion } from '../ui/accordion'
import { Button } from '../ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../ui/navigation-menu'
import { DesktopNavItem } from './DesktopNavItem'
import { MobileNavItem, MobileNavLink } from './MobileNavItem'

export type LinkType = {
  type?: 'internal' | 'external' | null
  url?: string | null
  label?: string | null
  newTab?: boolean | null
  reference?:
    | { relationTo: 'pages'; value: number | Page }
    | { relationTo: 'posts'; value: number | Post }
    | null
}

export type NavItem = {
  id?: string | null
  link?: LinkType | null
  items?: NavItem[] | null
}

export const getUrl = (link?: LinkType | null): string => {
  if (!link) return ''

  if (link.type === 'external' && link.url) {
    return link.url
  }

  if (link.type === 'internal') {
    if (link.url) return link.url
  }

  return '#'
}

export const getLabel = (link: LinkType | null | undefined, fallback: string): string => {
  if (!link) return 'No link label'

  if (link.label) return link.label
  return fallback
}

export const hasItems = (section: NavItem): boolean => {
  return Boolean(section.items && section.items.length > 0)
}

export const HeaderClient = ({ nav, banner }: { nav: Navigation; banner?: Media }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
  }, [setHeaderTheme, pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
  }, [theme, setTheme, headerTheme])

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
    <header className="bg-[#142D56]" {...(theme ? { 'data-theme': theme } : {})}>
      <Dialog open={mobileNavOpen} onOpenChange={setMobileNavOpen} modal={false}>
        <div ref={navbarRef} className="md:hidden fixed z-50 inset-x-0 py-3 bg-[#142D56]">
          <div className="container flex justify-between items-center gap-5">
            <DialogTrigger className="p-2">
              <div className="flex w-6 h-6 flex-col items-center justify-center space-y-[5px] overflow-hidden outline-none">
                <span
                  className={`bg-white h-[2px] w-full rounded transition-all duration-300 ease-in-out ${
                    mobileNavOpen ? 'translate-x-full' : ''
                  }`}
                ></span>
                <span
                  className={`bg-white h-[2px] w-full rounded transition-all duration-300 ease-in-out ${
                    mobileNavOpen ? 'mx-auto rotate-45' : ''
                  }`}
                ></span>
                <span
                  className={`bg-white h-[2px] w-full  rounded transition-all duration-300 ease-in-out ${
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
            <Button className="bg-[#E0F94B] text-black">Donate</Button>
          </div>
        </div>
        <DialogPortal>
          <div
            className={cn('md:hidden fixed inset-0', mobileNavOpen && 'pointer-events-none')}
            onClick={() => setMobileNavOpen(false)}
          />
          <DialogContent className="md:hidden max-h-[calc(100vh-64px)] overflow-y-auto fixed z-40 bg-[#142D56] text-white pb-2 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-x-0 top-[64px] border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top">
            <DialogTitle className="sr-only">menu</DialogTitle>
            <DialogDescription className="sr-only">navigation menu</DialogDescription>
            <Accordion type="multiple" className="container" asChild>
              <nav className="">
                <MobileNavLink
                  name="Forecasts"
                  link={{
                    type: 'external',
                    url: '/forecasts/avalanche',
                  }}
                  setMobileNavOpen={setMobileNavOpen}
                />
                {nav.weather && (
                  <MobileNavItem
                    name="Weather"
                    navItem={nav.weather}
                    setMobileNavOpen={setMobileNavOpen}
                  />
                )}
                <MobileNavLink
                  name="Observations"
                  link={{
                    type: 'external',
                    url: '/observations',
                  }}
                  setMobileNavOpen={setMobileNavOpen}
                />
                {nav.education && (
                  <MobileNavItem
                    name="Education"
                    navItem={nav.education}
                    setMobileNavOpen={setMobileNavOpen}
                  />
                )}
                {nav.accidents && (
                  <MobileNavItem
                    name="Accidents"
                    navItem={nav.accidents}
                    setMobileNavOpen={setMobileNavOpen}
                  />
                )}
                <MobileNavLink
                  name="Blog"
                  link={{
                    type: 'external',
                    url: '/posts',
                  }}
                  setMobileNavOpen={setMobileNavOpen}
                />
                <MobileNavLink
                  name="Events"
                  link={{
                    type: 'external',
                    url: '#',
                  }}
                  setMobileNavOpen={setMobileNavOpen}
                />
                {nav.about && (
                  <MobileNavItem
                    name="About"
                    navItem={nav.about}
                    setMobileNavOpen={setMobileNavOpen}
                  />
                )}
                {nav.support && (
                  <MobileNavItem
                    name="Support"
                    navItem={nav.support}
                    setMobileNavOpen={setMobileNavOpen}
                  />
                )}
              </nav>
            </Accordion>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <div className="hidden lg:flex container pt-8 pb-5 flex-col justify-center items-center gap-8">
        {banner && (
          <Link href="/" className="w-fit">
            <ImageMedia
              resource={banner}
              loading="eager"
              priority={true}
              imgClassName="h-[90px] object-contain w-fit"
            />
          </Link>
        )}
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/forecasts/avalanche" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Forecasts
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {nav.weather && <DesktopNavItem name="Weather" navItem={nav.weather} />}
              <NavigationMenuItem>
                <Link href="/observations" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Observations
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {nav.education && <DesktopNavItem name="Education" navItem={nav.education} />}
              {nav.accidents && <DesktopNavItem name="Accidents" navItem={nav.accidents} />}
              <NavigationMenuItem>
                <Link href="/posts" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="#" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Events
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {nav.about && <DesktopNavItem name="About" navItem={nav.about} />}
              {nav.support && <DesktopNavItem name="Support" navItem={nav.support} />}
              <NavigationMenuItem>
                <Link href="/donate" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Button className="bg-[#E0F94B] text-black">Donate</Button>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </header>
  )
}

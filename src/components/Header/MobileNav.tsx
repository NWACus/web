'use client'
import { Media } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { Divider } from '@payloadcms/ui/elements/Popup/PopupButtonList'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@radix-ui/react-dialog'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ImageMedia } from '../Media/ImageMedia'
import { Accordion } from '../ui/accordion'
import { Button } from '../ui/button'
import { MobileNavItem, MobileNavLink } from './MobileNavItem'
import { getLabel, TopLevelNavItemDefinition } from './utils'

export const MobileNav = ({
  topLevelNavItems,
  banner,
}: {
  topLevelNavItems: TopLevelNavItemDefinition[]
  banner?: Media
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const handleSetMobileNavOpen = (open: boolean) => {
    setMobileNavOpen(open)

    if (!open) {
      setTimeout(function delayForAnimation() {
        setSubNavPageIdx(null)
      }, 300)
    }
  }

  const [subNavPageIdx, setSubNavPageIdx] = useState<number | null>(null)
  const subNavPage = subNavPageIdx ? topLevelNavItems[subNavPageIdx] : null

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

  const navbarRef = useRef<HTMLDivElement | null>(null)

  return (
    <Dialog open={mobileNavOpen} onOpenChange={handleSetMobileNavOpen} modal={false}>
      <div ref={navbarRef} className="md:hidden fixed z-50 inset-x-0 py-3 bg-[#142D56] shadow-md">
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
          onClick={() => handleSetMobileNavOpen(false)}
        />
        <DialogContent className="md:hidden max-h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden fixed z-40 bg-[#142D56] text-white shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-x-0 top-[64px] border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top">
          <DialogTitle className="sr-only">menu</DialogTitle>
          <DialogDescription className="sr-only">navigation menu</DialogDescription>
          <div className="relative w-full min-h-[75vh]">
            <Accordion type="single" collapsible asChild>
              <nav
                className={cn(
                  'divide-y divide-[#1b355e] absolute w-full transition-transform duration-300 ease-out',
                  subNavPageIdx !== null && '-translate-x-full',
                )}
              >
                {topLevelNavItems.map((navItem, idx) => {
                  if (navItem.item) {
                    return (
                      <MobileNavItem
                        key={navItem.label}
                        label={navItem.label}
                        navItem={navItem.item}
                        setMobileNavOpen={handleSetMobileNavOpen}
                        setSubNavPage={() => setSubNavPageIdx(idx)}
                      />
                    )
                  }

                  return null
                })}
              </nav>
            </Accordion>
            <div
              className={cn(
                'absolute w-full transition-transform duration-300 ease-out translate-x-0',
                subNavPageIdx === null && 'translate-x-full',
              )}
            >
              {subNavPage && (
                <div className="container py-5 flex flex-col gap-5">
                  <div className="flex items-center gap-5">
                    <Button variant="outline" size="clear" className="bg-transparent flex p-0.5">
                      <ChevronLeft
                        className="w-6 h-6 flex-shrink-0"
                        onClick={() => setSubNavPageIdx(null)}
                      />
                    </Button>
                    <span className="text-lg">{subNavPage.label}</span>
                  </div>
                  <Divider />
                  <ul className="flex flex-col">
                    {subNavPage.item?.items?.map((item, idx) => (
                      <li key={getLabel(item.link, item.id ?? `${idx}`)}>
                        <>
                          {item.items && item.items.length > 0 ? (
                            <>
                              <div className="capitalize font-medium py-3">
                                {getLabel(item.link, '')}
                              </div>
                              {item.items.map((item) => (
                                <MobileNavLink
                                  label={getLabel(item.link, '')}
                                  link={item.link}
                                  setMobileNavOpen={setMobileNavOpen}
                                />
                              ))}
                            </>
                          ) : (
                            <MobileNavLink
                              label={getLabel(item.link, '')}
                              link={item.link}
                              setMobileNavOpen={setMobileNavOpen}
                              className="pl-0"
                            />
                          )}
                        </>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

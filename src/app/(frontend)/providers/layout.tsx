import Image from 'next/image'

export default async function ProvidersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-screen overflow-x-hidden">
      <header className="bg-header shadow-sm border-b mb-8">
        <div className="container py-4 md:py-8 flex items-center gap-4">
          <Image
            alt="avy fx logo"
            src="/assets/icon.png"
            width={1024}
            height={1024}
            loading="eager"
            fetchPriority="high"
            className="h-12 md:h-20 w-auto"
          />
          <div className="h-6 md:h-16 w-px bg-slate-200 rounded" />
          <Image
            alt="american avalanche association logo"
            src="/assets/a3-logo-wide.png"
            width={701}
            height={783}
            loading="eager"
            fetchPriority="high"
            className="h-12 md:h-20 w-auto"
          />
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

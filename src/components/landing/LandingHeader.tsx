/** The AvyWeb wordmark and pitch that open the root landing page. */
export function LandingHeader() {
  return (
    <header className="container pb-12 pt-16 md:pb-16 md:pt-24">
      <h1 className="text-7xl font-black leading-none tracking-tight md:text-[8.5rem]">AvyWeb</h1>
      <div className="mt-8 grid gap-6">
        <p className="text-2xl font-light leading-snug md:text-3xl">
          A website platform that lets avalanche centers run their own sites within one shared
          system.
        </p>
        <p className="text-base leading-relaxed text-slate-600">
          AvyWeb is a joint initiative between the Northwest Avalanche Center, the National
          Avalanche Center, the Sierra Avalanche Center and the Sawtooth Avalanche Center. Each
          center keeps its own identity while sharing infrastructure, cross-center content, design
          improvements and user experience research that strengthen the whole system.
        </p>
      </div>
    </header>
  )
}

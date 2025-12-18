import Image from 'next/image'

export function A3Banner() {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-end gap-3 mb-4 border-b pb-3">
      <div className="flex-shrink-0">
        <Image
          src="/assets/a3-logo.png"
          alt="A3 Logo"
          width={1361}
          height={444}
          className="w-auto h-12"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        A3 recognized providers meet national review standards for course curriculum, instruction,
        and safety.
      </p>
    </div>
  )
}

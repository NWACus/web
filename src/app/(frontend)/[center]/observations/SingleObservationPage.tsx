import { NACWidget } from '@/components/NACWidget'
import ObservationsDisclaimer from '@/components/ObservationsDisclaimer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SingleObservationPage({
  title,
  center,
  widgetsVersion,
  widgetsBaseUrl,
}: {
  title: string
  center: string
  widgetsVersion: string
  widgetsBaseUrl: string
}) {
  return (
    <div className="container flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4 prose dark:prose-invert max-w-none">
          <h1 className="font-bold">{title}</h1>
          <div className="flex flex-row flex-wrap gap-2">
            <Button asChild variant="secondary" className="no-underline">
              <Link href="/observations">Recent Observations</Link>
            </Button>
            <Button asChild variant="secondary" className="no-underline">
              <Link href="/observations/submit">Submit Observation</Link>
            </Button>
          </div>
        </div>
        <ObservationsDisclaimer />
      </div>
      <NACWidget
        center={center}
        widget={'observations'}
        widgetsVersion={widgetsVersion}
        widgetsBaseUrl={widgetsBaseUrl}
      />
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { ChartLine, Table2 } from 'lucide-react'
import Link from 'next/link'

// The widget modal's "Area Tables" and "Area Plots": the station page that shows this station
// alongside its neighbours, with the editor's columns.
export function StationAreaLinks({ slug }: { slug: string }) {
  const href = `/weather/stations/${slug}`
  return (
    <ButtonGroup aria-label="Open the area's station page" className="mt-3">
      <Button asChild size="sm" variant="outline">
        <Link href={href}>
          <Table2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Area Tables
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={`${href}?range=graphs`}>
          <ChartLine className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Area Graphs
        </Link>
      </Button>
    </ButtonGroup>
  )
}

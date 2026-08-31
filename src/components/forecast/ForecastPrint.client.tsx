'use client'

/**
 * "Print" control for a forecast product, replacing the legacy afp print widget.
 *
 * The legacy widget rasterized a hidden DOM copy with html2pdf, producing a multi-megabyte
 * image-only PDF with no selectable text. This prints the live page instead: the reader picks
 * sections, we record the choice on `<html data-print-sections>` for the print stylesheet in
 * `print.css`, name the file via `document.title`, and hand off to `window.print()`. The reader
 * saves a real text PDF from their browser's dialog — searchable, with working links, and
 * guaranteed to match what they were just looking at, since it *is* what they were looking at.
 */
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAnalytics } from '@/utilities/useAnalytics'
import { Printer } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'

import {
  DEFAULT_PRINT_SECTIONS,
  PRINT_SECTION_LABELS,
  PRINT_SECTIONS,
  type PrintSection,
} from './forecastPrintSections'

interface ForecastPrintProps {
  /** Sections this product has content for — the only ones offered as checkboxes. */
  availableSections: PrintSection[]
  /** Filename (no extension) offered in the browser's save dialog. */
  filename: string
  centerName: string
  /** The avalanche center's own website, as published by the NAC API. */
  centerUrl: string
}

export function ForecastPrint({
  availableSections,
  filename,
  centerName,
  centerUrl,
}: ForecastPrintProps) {
  const { captureWithTenant } = useAnalytics()
  const printSelection = usePrintSelection(filename)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<PrintSection[]>(() =>
    availableSections.filter((section) => DEFAULT_PRINT_SECTIONS.includes(section)),
  )

  const toggle = useCallback((section: PrintSection, checked: boolean) => {
    setSelected((current) =>
      checked
        ? // Keep canonical order so the attribute reads the same regardless of click order.
          PRINT_SECTIONS.filter((s) => s === section || current.includes(s))
        : current.filter((s) => s !== section),
    )
  }, [])

  const print = useCallback(() => {
    captureWithTenant('forecast_print', { sections: selected.join(',') })
    setOpen(false)
    printSelection(selected)
  }, [captureWithTenant, printSelection, selected])

  // A product with nothing printable offers no print. In practice unreachable — every product
  // has at least a bottom line or danger ratings — but printing an empty page helps nobody.
  if (availableSections.length === 0) return null

  return (
    <div className="shrink-0">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 print:hidden"
        onClick={() => setOpen(true)}
        aria-label="Print this forecast"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        Print
      </Button>

      <PrintMasthead centerName={centerName} centerUrl={centerUrl} />

      <PrintSectionsDialog
        open={open}
        onOpenChange={setOpen}
        availableSections={availableSections}
        selected={selected}
        onToggle={toggle}
        onPrint={print}
      />
    </div>
  )
}

/** The section picker, matching the legacy modal's wording and layout. */
function PrintSectionsDialog({
  open,
  onOpenChange,
  availableSections,
  selected,
  onToggle,
  onPrint,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableSections: PrintSection[]
  selected: PrintSection[]
  onToggle: (section: PrintSection, checked: boolean) => void
  onPrint: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select forecast sections to print:</DialogTitle>
          {/* The legacy modal showed no body copy; this is for screen readers, which otherwise
              get a heading and four checkboxes with no statement of what happens next. */}
          <DialogDescription className="sr-only">
            Choose which parts of this forecast to include, then print. Your browser&apos;s print
            dialog can save the result as a PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {availableSections.map((section) => (
            <div key={section} className="flex items-center gap-3">
              <Checkbox
                id={`print-section-${section}`}
                checked={selected.includes(section)}
                onCheckedChange={(checked) => onToggle(section, checked === true)}
              />
              <label htmlFor={`print-section-${section}`} className="cursor-pointer text-sm">
                {PRINT_SECTION_LABELS[section]}
              </label>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onPrint} disabled={selected.length === 0}>
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hands a section selection to the browser's print dialog: marks the document so the print
 * stylesheet can hide what wasn't chosen, renames it so the saved PDF gets a meaningful filename,
 * and undoes both once printing ends.
 */
function usePrintSelection(filename: string) {
  return useCallback(
    (sections: PrintSection[]) => {
      const root = document.documentElement
      const previousTitle = document.title

      root.dataset.printSections = sections.join(' ')
      document.title = filename

      // Restore on `afterprint` rather than straight after `window.print()`: the call is blocking
      // in some browsers and not others, and tearing the attribute down before the snapshot is
      // taken would silently print sections the reader deselected. A missed `afterprint` only
      // leaves a stale tab title, which the next print overwrites.
      const restore = () => {
        document.title = previousTitle
        delete root.dataset.printSections
        window.removeEventListener('afterprint', restore)
      }
      window.addEventListener('afterprint', restore)

      window.print()
    },
    [filename],
  )
}

/**
 * The print-only masthead: a QR code back to this page, and the issuing center. Neither has an
 * on-screen equivalent — they exist so a printed forecast carried into the field can be traced
 * back to its source, as the legacy PDF's header did.
 */
function PrintMasthead({ centerName, centerUrl }: { centerName: string; centerUrl: string }) {
  // Read after mount: the QR encodes the exact URL the reader is on, including the dated archive
  // route, and there is no server render of it to match.
  const [pageUrl, setPageUrl] = useState('')

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  return (
    // A fixed column rather than letting the URL size the box: a browser that lays print out at the
    // device viewport instead of the paper box (iOS Safari) would otherwise let one long URL push
    // the QR off the right edge. `break-words` keeps that guarantee — a token too long for the
    // column still breaks — without `break-all`'s habit of splitting every word that reaches the
    // edge, which turned "NORTHWEST AVALANCHE CENTER" into "...AVALANCHE CE / NTER".
    <div className="hidden print:flex print:w-[180px] print:flex-col print:items-end print:gap-2">
      {pageUrl && <QRCodeSVG value={pageUrl} size={100} level="H" />}
      <div className="w-full break-words text-right text-[10px] leading-tight text-muted-foreground">
        <p className="font-semibold uppercase tracking-wide">{centerName}</p>
        {/* Name and URL on separate lines, so the wrap point is a line break we chose rather than
            wherever the two happened to collide. The URL keeps its own case — uppercasing a host
            makes it ~30% wider for no gain — and drops the scheme and trailing slash, which are
            the longest part of it and the part a reader typing it back in would skip anyway. */}
        <p>{displayUrl(centerUrl)}</p>
      </div>
    </div>
  )
}

/** `https://www.nwac.us/` → `www.nwac.us`. Leaves anything that isn't a plain http(s) URL alone. */
function displayUrl(url: string): string {
  // Strip a leading http:// or https:// and any trailing slashes.
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

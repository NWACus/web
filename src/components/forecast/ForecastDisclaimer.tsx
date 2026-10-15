/**
 * Forecast scope disclaimer, shown under every product — matches the legacy afp Disclaimer.vue
 * word-for-word. The provider is "U.S.D.A. Forest Service" for USFS centers, otherwise the
 * center's name (afp reads `centerInfo.type == "usfs"` from the v2 avalanche-center response,
 * which we capture as `AvalancheCenterType`).
 */
import { AvalancheCenterType } from '@/services/nac/types/schemas'

interface ForecastDisclaimerProps {
  centerType: AvalancheCenterType
  centerName: string
}

export function ForecastDisclaimer({ centerType, centerName }: ForecastDisclaimerProps) {
  const provider = centerType === AvalancheCenterType.USFS ? 'U.S.D.A. Forest Service' : centerName

  return (
    // On paper this is a footnote, not body copy: set small and tight, it fits in the slack at
    // the foot of the last content page instead of claiming a sheet of its own.
    <p className="py-6 text-center text-sm text-muted-foreground print:py-1 print:text-xs">
      This information is provided by the {provider} and describes general backcountry avalanche
      hazard and conditions.{' '}
      {/* afp breaks the second sentence onto its own line on desktop, inline on mobile. */}
      <br className="hidden md:inline printWide:inline" />
      It does not apply to ski areas and highways where avalanche mitigation is conducted.
    </p>
  )
}

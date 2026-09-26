import type { AvalancheCenter } from '@/services/nac/types/schemas'

/**
 * Whether the center shows glossary tooltips on its forecast products. The legacy widget's own
 * switch, set upstream on the AFP and read-only here like the other `widget_config` blocks.
 */
export const isGlossaryEnabled = (metadata: Pick<AvalancheCenter, 'widget_config'>): boolean =>
  metadata.widget_config.forecast?.glossary === true

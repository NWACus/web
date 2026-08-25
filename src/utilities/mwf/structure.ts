// The MWF product structure constant — the single source of truth for the
// product's temporal shape, frozen into every published forecast row so
// archive renders are immune to later changes. Direct port of products-api's
// api/core/mwf.py MWF_STRUCTURE, derived here from the shared forecast-logic
// constants so the two cannot drift.
import {
  BLOCKS,
  DEFAULT_DROP_FT,
  EXTENDED_BLOCKS,
  PERIODS,
  SENSIBLE_SLOTS,
  blocksFor,
  extendedBlocksFor,
  periodsFor,
} from './mwfData'

const BLOCK_PARTS: Record<string, string> = {
  am: 'Morning',
  pm: 'Afternoon',
  ev: 'Evening',
  nt: 'Night',
}

function issuanceSlice(type: 'morning' | 'afternoon') {
  return {
    periods: periodsFor(type).map((p) => p.key),
    blocks: blocksFor(type).map((b) => b.key),
    extendedBlocks: extendedBlocksFor(type).map((b) => b.key),
  }
}

export const MWF_STRUCTURE = {
  periods: PERIODS,
  blocks: BLOCKS.map((b) => ({
    ...b,
    part: BLOCK_PARTS[b.key.slice(0, 2)] ?? '',
  })),
  sensibleSlots: SENSIBLE_SLOTS.map((s) => ({ key: s.key, label: s.label })),
  extendedBlocks: EXTENDED_BLOCKS,
  issuances: {
    morning: issuanceSlice('morning'),
    afternoon: issuanceSlice('afternoon'),
  },
  // First 6h block of each 12h period — period-scaled views surface the finer
  // block fields through it.
  periodBlock: Object.fromEntries(
    PERIODS.map((p) => [p.key, BLOCKS.find((b) => b.period === p.key)?.key ?? '']),
  ),
  defaultDropFt: DEFAULT_DROP_FT,
}

export type MwfStructure = typeof MWF_STRUCTURE

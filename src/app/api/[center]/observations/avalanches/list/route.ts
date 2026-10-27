// False positive: fallow reads `(payload)/api/[...slug]` and `api/[center]` as one dynamic path
// and predicts a runtime crash. Route groups keep the two trees separate — see the danger-map route.
// fallow-ignore-file dynamic-segment-name-conflicts
import { listHandler } from '../../observationRoutes'

// Per request: the query string is the filter. Caching happens at the edge (see the handlers).
export const dynamic = 'force-dynamic'

export const GET = listHandler('avalanche')

/** Legacy v2 map-layer source: fetches+parses the v2 response, maps it into the model. */
import type { ZoneMapLayer } from '../../model/mapLayer'
import { getMapLayer } from '../../nac'
import type { MapLayerQuery, MapLayerSource } from '../types'
import { mapV2MapLayer } from './mappers'

export const mapLayerSourceV2: MapLayerSource = {
  async getMapLayer(centerSlug: string, query: MapLayerQuery = {}): Promise<ZoneMapLayer> {
    const wire = await getMapLayer(centerSlug, query)
    return mapV2MapLayer(wire)
  },
}

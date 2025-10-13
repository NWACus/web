import configPromise from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import { seed } from '../endpoints/seed'

const payload = await getPayload({ config: configPromise })
const payloadReq = await createLocalReq({}, payload)

await seed({ payload, req: payloadReq, incremental: false })

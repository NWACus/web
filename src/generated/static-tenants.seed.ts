// Seed file for CI bootstrap - uses fallback tenant data
// This file is committed to git and provides a baseline for builds
// when the database is not available or on first run

import { FALLBACK_TENANTS } from '../scripts/fallback-tenants'

export const STATIC_TENANTS = FALLBACK_TENANTS
export type StaticTenant = (typeof STATIC_TENANTS)[number]

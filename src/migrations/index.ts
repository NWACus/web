import * as migration_20250720_214829_init from './20250720_214829_init'

export const migrations = [
  {
    up: migration_20250720_214829_init.up,
    down: migration_20250720_214829_init.down,
    name: '20250720_214829_init',
  },
]

import * as migration_20250720_214829_init from './20250720_214829_init'
import * as migration_20250725_165619_rename_color_to_background_color from './20250725_165619_rename_color_to_background_color'
import * as migration_20250727_005201_add_background_color_to_link_preview from './20250727_005201_add_background_color_to_link_preview'

export const migrations = [
  {
    up: migration_20250720_214829_init.up,
    down: migration_20250720_214829_init.down,
    name: '20250720_214829_init',
  },
  {
    up: migration_20250725_165619_rename_color_to_background_color.up,
    down: migration_20250725_165619_rename_color_to_background_color.down,
    name: '20250725_165619_rename_color_to_background_color',
  },
  {
    up: migration_20250727_005201_add_background_color_to_link_preview.up,
    down: migration_20250727_005201_add_background_color_to_link_preview.down,
    name: '20250727_005201_add_background_color_to_link_preview',
  },
]

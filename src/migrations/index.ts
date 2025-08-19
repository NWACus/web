import * as migration_20250720_214829_init from './20250720_214829_init'
import * as migration_20250725_165619_rename_color_to_background_color from './20250725_165619_rename_color_to_background_color'
import * as migration_20250727_005201_add_background_color_to_link_preview from './20250727_005201_add_background_color_to_link_preview'
import * as migration_20250807_175342_blocks_in_content_field from './20250807_175342_blocks_in_content_field'
import * as migration_20250814_191230_diagnostics_global from './20250814_191230_diagnostics_global'
import * as migration_20250814_223446_update_slug_field from './20250814_223446_update_slug_field'
import * as migration_20250815_201139_add_secondary_phone_to_footer from './20250815_201139_add_secondary_phone_to_footer'
import * as migration_20250819_171010_blog_list_block from './20250819_171010_blog_list_block'

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
  {
    up: migration_20250807_175342_blocks_in_content_field.up,
    down: migration_20250807_175342_blocks_in_content_field.down,
    name: '20250807_175342_blocks_in_content_field',
  },
  {
    up: migration_20250814_191230_diagnostics_global.up,
    down: migration_20250814_191230_diagnostics_global.down,
    name: '20250814_191230_diagnostics_global',
  },
  {
    up: migration_20250814_223446_update_slug_field.up,
    down: migration_20250814_223446_update_slug_field.down,
    name: '20250814_223446_update_slug_field',
  },
  {
    up: migration_20250815_201139_add_secondary_phone_to_footer.up,
    down: migration_20250815_201139_add_secondary_phone_to_footer.down,
    name: '20250815_201139_add_secondary_phone_to_footer',
  },
  {
    up: migration_20250819_171010_blog_list_block.up,
    down: migration_20250819_171010_blog_list_block.down,
    name: '20250819_171010_blog_list_block',
  },
]

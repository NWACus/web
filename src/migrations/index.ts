import * as migration_20250720_214829_init from './20250720_214829_init'
import * as migration_20250725_165619_rename_color_to_background_color from './20250725_165619_rename_color_to_background_color'
import * as migration_20250727_005201_add_background_color_to_link_preview from './20250727_005201_add_background_color_to_link_preview'
import * as migration_20250807_175342_blocks_in_content_field from './20250807_175342_blocks_in_content_field'
import * as migration_20250814_191230_diagnostics_global from './20250814_191230_diagnostics_global'
import * as migration_20250814_223446_update_slug_field from './20250814_223446_update_slug_field'
import * as migration_20250815_201139_add_secondary_phone_to_footer from './20250815_201139_add_secondary_phone_to_footer'
import * as migration_20250818_061729_generic_embed_block from './20250818_061729_generic_embed_block'
import * as migration_20250820_004406_home_page_global_collection from './20250820_004406_home_page_global_collection'
import * as migration_20250821_205336_blog_list_block from './20250821_205336_blog_list_block'
import * as migration_20250823_200437_add_single_blog_post_block from './20250823_200437_add_single_blog_post_block'
import * as migration_20250824_200244_add_footer_form from './20250824_200244_add_footer_form'
import * as migration_20250828_211035_add_sponsors from './20250828_211035_add_sponsors'
import * as migration_20250828_230246_add_header_block from './20250828_230246_add_header_block'
import * as migration_20250829_035904_update_payload_version from './20250829_035904_update_payload_version'
import * as migration_20250904_014605_create_documents from './20250904_014605_create_documents'
import * as migration_20250904_233214_add_bg_color_and_layout_for_biography_blocks from './20250904_233214_add_bg_color_and_layout_for_biography_blocks'
import * as migration_20250905_042615_add_header_to_link_preview from './20250905_042615_add_header_to_link_preview'
import * as migration_20250906_203111_add_columns_to_content from './20250906_203111_add_columns_to_content'
import * as migration_20250909_012609_add_columns_to_content_default from './20250909_012609_add_columns_to_content_default'
import * as migration_20250909_033830_update_for_prod_content_bugs from './20250909_033830_update_for_prod_content_bugs'
import * as migration_20250915_230438_update_blog_list from './20250915_230438_update_blog_list'
import * as migration_20250920_185913_add_blocks_to_home_pages from './20250920_185913_add_blocks_to_home_pages'
import * as migration_20250922_185258_add_built_in_pages from './20250922_185258_add_built_in_pages'
import * as migration_20250925_144212_remove_meta_title from './20250925_144212_remove_meta_title'
import * as migration_20250926_145234_remove_embed_block_height from './20250926_145234_remove_embed_block_height'
import * as migration_20250930_184740_media_block_updates from './20250930_184740_media_block_updates'
import * as migration_20251001_012534_update_sponsors_block from './20251001_012534_update_sponsors_block'
import * as migration_20251001_171654_redirects_plugin_to_collection from './20251001_171654_redirects_plugin_to_collection'
import * as migration_20251001_180603_nav_items_with_enabled_toggle from './20251001_180603_nav_items_with_enabled_toggle'
import * as migration_20251001_221006_update_bios from './20251001_221006_update_bios'
import * as migration_20251016_001620_update_post_authors_date from './20251016_001620_update_post_authors_date'
import * as migration_20251020_222917_blocks_in_highlighted_content from './20251020_222917_blocks_in_highlighted_content'
import * as migration_20251023_195638_rename_indexes from './20251023_195638_rename_indexes'
import * as migration_20251024_203935_content_block_default_value from './20251024_203935_content_block_default_value'
import * as migration_20251029_173505_upgrade_payload_3_61_1 from './20251029_173505_upgrade_payload_3_61_1'
import * as migration_20251117_210840_kv from './20251117_210840_kv'
import * as migration_20251203_015551_add_courses_and_events from './20251203_015551_add_courses_and_events'
import * as migration_20251204_192406_add_bg_color_to_events_table from './20251204_192406_add_bg_color_to_events_table'
import * as migration_20251211_062340_add_nac_media_widget from './20251211_062340_add_nac_media_widget'
import * as migration_20251219_073149_remove_autosave from './20251219_073149_remove_autosave'
import * as migration_20260111_205454_nav_item_standalone_label from './20260111_205454_nav_item_standalone_label'
import * as migration_20260115_234107_remove_image_sizes from './20260115_234107_remove_image_sizes'
import * as migration_20260120_194629_unify_block_naming from './20260120_194629_unify_block_naming'
import * as migration_20260128_012456_remove_wrap_in_container from './20260128_012456_remove_wrap_in_container'

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
    up: migration_20250818_061729_generic_embed_block.up,
    down: migration_20250818_061729_generic_embed_block.down,
    name: '20250818_061729_generic_embed_block',
  },
  {
    up: migration_20250820_004406_home_page_global_collection.up,
    down: migration_20250820_004406_home_page_global_collection.down,
    name: '20250820_004406_home_page_global_collection',
  },
  {
    up: migration_20250821_205336_blog_list_block.up,
    down: migration_20250821_205336_blog_list_block.down,
    name: '20250821_205336_blog_list_block',
  },
  {
    up: migration_20250823_200437_add_single_blog_post_block.up,
    down: migration_20250823_200437_add_single_blog_post_block.down,
    name: '20250823_200437_add_single_blog_post_block',
  },
  {
    up: migration_20250824_200244_add_footer_form.up,
    down: migration_20250824_200244_add_footer_form.down,
    name: '20250824_200244_add_footer_form',
  },
  {
    up: migration_20250828_211035_add_sponsors.up,
    down: migration_20250828_211035_add_sponsors.down,
    name: '20250828_211035_add_sponsors',
  },
  {
    up: migration_20250828_230246_add_header_block.up,
    down: migration_20250828_230246_add_header_block.down,
    name: '20250828_230246_add_header_block',
  },
  {
    up: migration_20250829_035904_update_payload_version.up,
    down: migration_20250829_035904_update_payload_version.down,
    name: '20250829_035904_update_payload_version',
  },
  {
    up: migration_20250904_014605_create_documents.up,
    down: migration_20250904_014605_create_documents.down,
    name: '20250904_014605_create_documents',
  },
  {
    up: migration_20250904_233214_add_bg_color_and_layout_for_biography_blocks.up,
    down: migration_20250904_233214_add_bg_color_and_layout_for_biography_blocks.down,
    name: '20250904_233214_add_bg_color_and_layout_for_biography_blocks',
  },
  {
    up: migration_20250905_042615_add_header_to_link_preview.up,
    down: migration_20250905_042615_add_header_to_link_preview.down,
    name: '20250905_042615_add_header_to_link_preview',
  },
  {
    up: migration_20250906_203111_add_columns_to_content.up,
    down: migration_20250906_203111_add_columns_to_content.down,
    name: '20250906_203111_add_columns_to_content',
  },
  {
    up: migration_20250909_012609_add_columns_to_content_default.up,
    down: migration_20250909_012609_add_columns_to_content_default.down,
    name: '20250909_012609_add_columns_to_content_default',
  },
  {
    up: migration_20250909_033830_update_for_prod_content_bugs.up,
    down: migration_20250909_033830_update_for_prod_content_bugs.down,
    name: '20250909_033830_update_for_prod_content_bugs',
  },
  {
    up: migration_20250915_230438_update_blog_list.up,
    down: migration_20250915_230438_update_blog_list.down,
    name: '20250915_230438_update_blog_list',
  },
  {
    up: migration_20250920_185913_add_blocks_to_home_pages.up,
    down: migration_20250920_185913_add_blocks_to_home_pages.down,
    name: '20250920_185913_add_blocks_to_home_pages',
  },
  {
    up: migration_20250922_185258_add_built_in_pages.up,
    down: migration_20250922_185258_add_built_in_pages.down,
    name: '20250922_185258_add_built_in_pages',
  },
  {
    up: migration_20250925_144212_remove_meta_title.up,
    down: migration_20250925_144212_remove_meta_title.down,
    name: '20250925_144212_remove_meta_title',
  },
  {
    up: migration_20250926_145234_remove_embed_block_height.up,
    down: migration_20250926_145234_remove_embed_block_height.down,
    name: '20250926_145234_remove_embed_block_height',
  },
  {
    up: migration_20250930_184740_media_block_updates.up,
    down: migration_20250930_184740_media_block_updates.down,
    name: '20250930_184740_media_block_updates',
  },
  {
    up: migration_20251001_012534_update_sponsors_block.up,
    down: migration_20251001_012534_update_sponsors_block.down,
    name: '20251001_012534_update_sponsors_block',
  },
  {
    up: migration_20251001_171654_redirects_plugin_to_collection.up,
    down: migration_20251001_171654_redirects_plugin_to_collection.down,
    name: '20251001_171654_redirects_plugin_to_collection',
  },
  {
    up: migration_20251001_180603_nav_items_with_enabled_toggle.up,
    down: migration_20251001_180603_nav_items_with_enabled_toggle.down,
    name: '20251001_180603_nav_items_with_enabled_toggle',
  },
  {
    up: migration_20251001_221006_update_bios.up,
    down: migration_20251001_221006_update_bios.down,
    name: '20251001_221006_update_bios',
  },
  {
    up: migration_20251016_001620_update_post_authors_date.up,
    down: migration_20251016_001620_update_post_authors_date.down,
    name: '20251016_001620_update_post_authors_date',
  },
  {
    up: migration_20251020_222917_blocks_in_highlighted_content.up,
    down: migration_20251020_222917_blocks_in_highlighted_content.down,
    name: '20251020_222917_blocks_in_highlighted_content',
  },
  {
    up: migration_20251023_195638_rename_indexes.up,
    down: migration_20251023_195638_rename_indexes.down,
    name: '20251023_195638_rename_indexes',
  },
  {
    up: migration_20251024_203935_content_block_default_value.up,
    down: migration_20251024_203935_content_block_default_value.down,
    name: '20251024_203935_content_block_default_value',
  },
  {
    up: migration_20251029_173505_upgrade_payload_3_61_1.up,
    down: migration_20251029_173505_upgrade_payload_3_61_1.down,
    name: '20251029_173505_upgrade_payload_3_61_1',
  },
  {
    up: migration_20251117_210840_kv.up,
    down: migration_20251117_210840_kv.down,
    name: '20251117_210840_kv',
  },
  {
    up: migration_20251203_015551_add_courses_and_events.up,
    down: migration_20251203_015551_add_courses_and_events.down,
    name: '20251203_015551_add_courses_and_events',
  },
  {
    up: migration_20251204_192406_add_bg_color_to_events_table.up,
    down: migration_20251204_192406_add_bg_color_to_events_table.down,
    name: '20251204_192406_add_bg_color_to_events_table',
  },
  {
    up: migration_20251211_062340_add_nac_media_widget.up,
    down: migration_20251211_062340_add_nac_media_widget.down,
    name: '20251211_062340_add_nac_media_widget',
  },
  {
    up: migration_20251219_073149_remove_autosave.up,
    down: migration_20251219_073149_remove_autosave.down,
    name: '20251219_073149_remove_autosave',
  },
  {
    up: migration_20260111_205454_nav_item_standalone_label.up,
    down: migration_20260111_205454_nav_item_standalone_label.down,
    name: '20260111_205454_nav_item_standalone_label',
  },
  {
    up: migration_20260115_234107_remove_image_sizes.up,
    down: migration_20260115_234107_remove_image_sizes.down,
    name: '20260115_234107_remove_image_sizes',
  },
  {
    up: migration_20260120_194629_unify_block_naming.up,
    down: migration_20260120_194629_unify_block_naming.down,
    name: '20260120_194629_unify_block_naming',
  },
  {
    up: migration_20260128_012456_remove_wrap_in_container.up,
    down: migration_20260128_012456_remove_wrap_in_container.down,
    name: '20260128_012456_remove_wrap_in_container',
  },
]

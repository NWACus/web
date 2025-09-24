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
import * as migration_20250924_220322_redirects_plugin_to_collection from './20250924_220322_redirects_plugin_to_collection'

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
    up: migration_20250924_220322_redirects_plugin_to_collection.up,
    down: migration_20250924_220322_redirects_plugin_to_collection.down,
    name: '20250924_220322_redirects_plugin_to_collection',
  },
]

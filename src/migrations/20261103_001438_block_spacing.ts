import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_blog_list\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_blog_list\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_content\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_content\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_document_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_document_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_event_list\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_event_list\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_event_table\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_event_table\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_form_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_form_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_form_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_form_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_gallery\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_gallery\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_generic_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_generic_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_header_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_header_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_image_link_grid\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_image_link_grid\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_image_text\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_image_text\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_link_preview\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_link_preview\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_media_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_media_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_nac_media_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_nac_media_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_observations_widget\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_observations_widget\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_precip_table\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_precip_table\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_single_blog_post\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_single_blog_post\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_single_event\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_single_event\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`home_pages_blocks_team\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_team\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_video_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_video_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_blog_list\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_blog_list\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_content\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_content\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_event_list\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_event_list\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_event_table\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_event_table\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_form_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_form_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_form_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_form_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_gallery\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_gallery\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_generic_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_generic_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_image_link_grid\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_image_link_grid\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_image_text\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_image_text\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_link_preview\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_link_preview\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_nac_media_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_nac_media_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_observations_widget\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_observations_widget\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_precip_table\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_precip_table\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_single_blog_post\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_single_blog_post\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_single_event\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_single_event\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_team\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_team\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_video_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_video_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_blog_list\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_blog_list\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_content\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_content\` ADD \`spacing_bottom\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_document_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_document_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_event_list\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_event_list\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_event_table\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_event_table\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_form_block\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_form_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_form_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_form_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_gallery\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_gallery\` ADD \`spacing_bottom\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_generic_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_generic_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_header_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_header_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_image_link_grid\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_image_link_grid\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_image_text\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_image_text\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_link_preview\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_link_preview\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_media_block\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_media_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_nac_media_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_nac_media_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_observations_widget\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_observations_widget\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_precip_table\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_precip_table\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_single_blog_post\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_single_blog_post\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_single_event\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_single_event\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_sponsors_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`pages_blocks_sponsors_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_team\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_team\` ADD \`spacing_bottom\` text DEFAULT 'sm';`)
  await db.run(sql`ALTER TABLE \`pages_blocks_video_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_video_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_blog_list\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_blog_list\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_content\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_content\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_event_list\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_event_list\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_event_table\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_event_table\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_form_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_form_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_form_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_form_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_gallery\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_gallery\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_generic_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_generic_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_header_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_header_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_image_link_grid\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_image_link_grid\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_image_text\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_image_text\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_link_preview\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_link_preview\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_media_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_media_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_nac_media_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_nac_media_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_observations_widget\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_observations_widget\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_precip_table\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_precip_table\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_single_blog_post\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_single_blog_post\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_single_event\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_single_event\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_team\` ADD \`spacing_top\` text DEFAULT 'sm';`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_team\` ADD \`spacing_bottom\` text DEFAULT 'sm';`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_video_embed\` ADD \`spacing_top\` text DEFAULT 'sm';`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_video_embed\` ADD \`spacing_bottom\` text DEFAULT 'sm';`,
  )
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`home_pages_blocks_blog_list\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_blog_list\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_content\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_content\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_document_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_document_block\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`home_pages_blocks_event_list\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_event_list\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_event_table\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_event_table\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_form_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_form_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_form_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_form_embed\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_gallery\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_gallery\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_generic_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_generic_embed\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_header_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_header_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_image_link_grid\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_image_link_grid\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`home_pages_blocks_image_text\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_image_text\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_link_preview\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_link_preview\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_media_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_media_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_nac_media_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_nac_media_block\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_observations_widget\` DROP COLUMN \`spacing_top\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_observations_widget\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`home_pages_blocks_precip_table\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_precip_table\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_single_blog_post\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_single_blog_post\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`home_pages_blocks_single_event\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_single_event\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`home_pages_blocks_sponsors_block\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`home_pages_blocks_team\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_team\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_video_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`home_pages_blocks_video_embed\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_blog_list\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_blog_list\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_content\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_content\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` DROP COLUMN \`spacing_top\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_document_block\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_event_list\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_event_list\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_event_table\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_event_table\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_form_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_form_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_form_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_form_embed\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_gallery\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_gallery\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_generic_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_generic_embed\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_header_block\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_image_link_grid\` DROP COLUMN \`spacing_top\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_image_link_grid\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_image_text\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_image_text\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_link_preview\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_link_preview\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_media_block\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_nac_media_block\` DROP COLUMN \`spacing_top\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_nac_media_block\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_observations_widget\` DROP COLUMN \`spacing_top\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_observations_widget\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_precip_table\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_precip_table\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_single_blog_post\` DROP COLUMN \`spacing_top\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_single_blog_post\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_single_event\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_single_event\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` DROP COLUMN \`spacing_top\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_sponsors_block\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_team\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_team\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_home_pages_v_blocks_video_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`_home_pages_v_blocks_video_embed\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_blog_list\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_blog_list\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_content\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_content\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_document_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_document_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_event_list\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_event_list\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_event_table\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_event_table\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_form_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_form_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_form_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_form_embed\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_gallery\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_gallery\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_generic_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_generic_embed\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_header_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_header_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_link_grid\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_link_grid\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_text\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_image_text\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_link_preview\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_link_preview\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_media_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_media_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_nac_media_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_nac_media_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_observations_widget\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`pages_blocks_observations_widget\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`pages_blocks_precip_table\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_precip_table\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_single_blog_post\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_single_blog_post\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_single_event\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_single_event\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_sponsors_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_sponsors_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_team\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_team\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_video_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`pages_blocks_video_embed\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_blog_list\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_blog_list\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_content\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_content\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_event_list\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_event_list\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_event_table\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_event_table\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_form_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_form_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_form_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_form_embed\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_gallery\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_gallery\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_generic_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_generic_embed\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_header_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_header_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_link_grid\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_link_grid\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_text\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_image_text\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_link_preview\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_link_preview\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_media_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_media_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_nac_media_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_nac_media_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_observations_widget\` DROP COLUMN \`spacing_top\`;`,
  )
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_observations_widget\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_precip_table\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_precip_table\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_single_blog_post\` DROP COLUMN \`spacing_top\`;`)
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_single_blog_post\` DROP COLUMN \`spacing_bottom\`;`,
  )
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_single_event\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_single_event\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_sponsors_block\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_team\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_team\` DROP COLUMN \`spacing_bottom\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_embed\` DROP COLUMN \`spacing_top\`;`)
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_embed\` DROP COLUMN \`spacing_bottom\`;`)
}

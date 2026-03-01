# Changelog

All notable changes to this project will be documented in this file.

This changelog is managed by [changesets](https://github.com/changesets/changesets).

## 1.9.1 — 2026-02-27

Fixes generic embed issue on Chrome reported by Sierra.

### **🐛 Bug Fixes**

- Generic embeds failing on chromium - switch to blob by @rchlfryn in https://github.com/NWACus/web/pull/952

### **⚙️ Infra/CI**

- Improve production release - manual deploy & display tag by @rchlfryn in https://github.com/NWACus/web/pull/951

### **💻 For the devs**

- Debug cleanup by @rchlfryn in https://github.com/NWACus/web/pull/958
- Fix bad migration json by @rchlfryn in https://github.com/NWACus/web/pull/959

## 1.9.0 — 2026-02-18

This release doesn't have any user facing changes.

### **⚙️ Infra/CI**

- Exclude /ingest from middleware matcher by @rchlfryn in https://github.com/NWACus/web/pull/950

### **💻 For the devs**

- e2e Tests - admin panel, RBAC & GHA by @busbyk in https://github.com/NWACus/web/pull/903
- Add unit tests for frontend utilities by @rchlfryn in https://github.com/NWACus/web/pull/944
- Add frontend page load e2e tests by @rchlfryn in https://github.com/NWACus/web/pull/945
- Speed up e2e tests with Playwright storageState auth caching by @rchlfryn in https://github.com/NWACus/web/pull/948

## 1.8.0 — 2026-02-13

Primarily a bug squashing release. We now allow tags from Donorbox in the generic embed block, and also tweaked generic embed to allow Watch on Youtube to work. (see Bug section for more fixes)

This release also contains a GitHub Action to add a release version to issues once they are released, similar to Payload.

### **🐛 Bug Fixes**

- Embed block - add allowed tag and attributes by @rchlfryn in https://github.com/NWACus/web/pull/931
- Fix: prevent widget getting stuck at `#/all` when navigating forecast dates by @rchlfryn in https://github.com/NWACus/web/pull/932
- Styling updates - update UI at tablet breakpoint, improve theme preview and all blocks pages by @rchlfryn in https://github.com/NWACus/web/pull/935
- Fix console errors - hydration from form & iframe by @rchlfryn in https://github.com/NWACus/web/pull/937
- Update timezone to use name instead of GMT- by @rchlfryn in https://github.com/NWACus/web/pull/936
- Fix event page featured image overlap by @rchlfryn in https://github.com/NWACus/web/pull/940
- Update snfac button color to be accessible by @rchlfryn in https://github.com/NWACus/web/pull/943

### **💻 For the devs**

- Revert "Undo nav link refactor" by @rchlfryn in https://github.com/NWACus/web/pull/930
- Remove debugging logging by @rchlfryn in https://github.com/NWACus/web/pull/934

### **⚙️ Infra/CI**

- GHA: Add post-release workflow by @rchlfryn in https://github.com/NWACus/web/pull/939

## 1.7.1 — 2026-02-07

This is a "quick" follow up from a buggy 1.7.0. Fixes intermittent 404 errors from #897 & incorrect validations from #895

### **🐛 Bug Fixes**

- Fix content validation: remove filterOption for nacMediaBlock by @rchlfryn in https://github.com/NWACus/web/pull/913
- Fix external link validation by @rchlfryn in https://github.com/NWACus/web/pull/927

### **💻 For the devs**

- Undo nav link refactor by @rchlfryn in https://github.com/NWACus/web/pull/917
- Revert #897 by @rchlfryn in https://github.com/NWACus/web/pull/926

## 1.7.0 — 2026-02-02

- Provider managers can now edit and delete provider users
- We did remove live preview (the side by side editor view), but regular preview is still available
- We improved the background color picking experience for blocks in the lexical editor like Content or on the Homepage. Now when a user selects a background color, extra space will be added to see the background color.
- We updated our README and Wiki to take one step closer in supporting folks to contribute

### **💫 Features & Delights**

- Allow providers to edit and delete users they have access to by @rchlfryn in https://github.com/NWACus/web/pull/894
- Improve and simplify `wrapInContainer` behavior with background color picker by @rchlfryn in https://github.com/NWACus/web/pull/899

### **💻 For the devs**

- Rewrite README to reference updated wiki by @rchlfryn in https://github.com/NWACus/web/pull/882
- Clean up how we use links by @rchlfryn in https://github.com/NWACus/web/pull/892
- Remove live preview by @rchlfryn in https://github.com/NWACus/web/pull/886
- Remove some type assertions by @rchlfryn in https://github.com/NWACus/web/pull/896

### **🐛 Bug Fixes**

- Update validate functions to use default field validations by @rchlfryn in https://github.com/NWACus/web/pull/895
- Fix infinite events api call by @rchlfryn in https://github.com/NWACus/web/pull/905

### **📚 Documentation**

- Update license by @rchlfryn in https://github.com/NWACus/web/pull/891

### **⚙️ Infra/CI**

- Remove vercel deployments for `main` branch by @rchlfryn in https://github.com/NWACus/web/pull/880
- Add production env to preview.yml by @rchlfryn in https://github.com/NWACus/web/pull/893
- Bump next from 15.5.9 to 15.5.10 by @dependabot[bot] in https://github.com/NWACus/web/pull/898
- Update robots file to include facebook and twitter by @rchlfryn in https://github.com/NWACus/web/pull/906
- Bump the payloadcms group across 1 directory with 16 updates by @dependabot[bot] in https://github.com/NWACus/web/pull/907
- Bump eslint from 9.23.0 to 9.26.0 by @dependabot[bot] in https://github.com/NWACus/web/pull/910

## 1.6.0 — 2026-01-26

- The dashboard is now "configurable". This new PayloadCMS feature is turned on by default in the latest version. You can re-order and resize "widgets" in the dashboard and that will be saved in your user's preferences. We haven't built any custom widgets yet but plan to under #280.
- The column selector in the Content block now auto-selects the first valid option when the number of columns is changed by the user.
  ![CleanShot 2026-01-26 at 10 23 35](https://github.com/user-attachments/assets/1a1b55c2-ce16-4e10-9c6d-9627461764d3)

### **💫 Features**

- Dashboard widgets: Getting started widget by @busbyk in https://github.com/NWACus/web/pull/859
- Improve column selector for content blocks by @rchlfryn in https://github.com/NWACus/web/pull/862
- Appropriate image sizing by @busbyk in https://github.com/NWACus/web/pull/867

### **🐛 Bug Fixes**

- Bugfix: Fixing event date hydration error by @busbyk in https://github.com/NWACus/web/pull/851
- Bugfix: Fix navigation canonical URL resolution and improve admin UX for nav items by @busbyk in https://github.com/NWACus/web/pull/848
- Sort International (INTL) state option to bottom of providers embed list by @busbyk in https://github.com/NWACus/web/pull/868
- Update prefixFilenameWithTenant to work with Local API too by @busbyk in https://github.com/NWACus/web/pull/881

### **📚 Documentation**

- Unify block naming by @rchlfryn in https://github.com/NWACus/web/pull/873

### **⚙️ Infra/CI**

- Bump Payload to version 3.71.1 by @busbyk in https://github.com/NWACus/web/pull/857
- Add vercel cleanup to GHA by @rchlfryn in https://github.com/NWACus/web/pull/856
- Fix cleanup GHA by @rchlfryn in https://github.com/NWACus/web/pull/870
- Add payload workaround issue by @rchlfryn in https://github.com/NWACus/web/pull/864
- Bump Payload to version 3.72.0 by @dependabot[bot] in https://github.com/NWACus/web/pull/872
- Add Claude GitHub integration for issue-driven development by @busbyk in https://github.com/NWACus/web/pull/871
- Update deployment script to clean up vercel deployments by @rchlfryn in https://github.com/NWACus/web/pull/874
- Development script - Add line to debug by @rchlfryn in https://github.com/NWACus/web/pull/876
- DEBUG: Update development script by @rchlfryn in https://github.com/NWACus/web/pull/877
- DEBUG: Final debug to confirm development script by @rchlfryn in https://github.com/NWACus/web/pull/879
- Bump diff from 4.0.2 to 4.0.4 by @dependabot[bot] in https://github.com/NWACus/web/pull/875
- Bump diff from 4.0.2 to 4.0.4 by @dependabot[bot] in https://github.com/NWACus/web/pull/883
- Bump lodash-es from 4.17.21 to 4.17.23 by @dependabot[bot] in https://github.com/NWACus/web/pull/884
- Workflow to auto-format dependabot branches by @busbyk in https://github.com/NWACus/web/pull/885
- Version upgrades: react-email, lucide-react, react-hook-form by @busbyk in https://github.com/NWACus/web/pull/887
- Verified dependabot formatting commits by @busbyk in https://github.com/NWACus/web/pull/890

## 1.5.0 — 2026-01-12

- We removed autosave on all collection. Users can now save their document with `Save as draft` button or `CMD + S`
- We added an international option for providers and courses
- We fixed bugs in the observation widget allowing users to properly navigate back and select different single observations

### **💫 Features**

- Remove autosave on all collections by @rchlfryn in https://github.com/NWACus/web/pull/813
- Add international as a state for courses and providers by @rchlfryn in https://github.com/NWACus/web/pull/849

### **🐛 Bug Fixes**

- Removing temporary production debug logging by @busbyk in https://github.com/NWACus/web/pull/765
- Allow script tags in generic embeds by @busbyk in https://github.com/NWACus/web/pull/837
- Await form initialization before setting tenant field value by @busbyk in https://github.com/NWACus/web/pull/838
- Fix single observation widget linking by @rchlfryn in https://github.com/NWACus/web/pull/846
- Do not cache non-tenant-scoped 404s by @busbyk in https://github.com/NWACus/web/pull/847
- Fix duplicate for all collections by @rchlfryn in https://github.com/NWACus/web/pull/835

### **📚 Documentation**

- Docs: Onboarding (updates) by @busbyk in https://github.com/NWACus/web/pull/843
- CLAUDE.md file by @busbyk in https://github.com/NWACus/web/pull/850
- Update PR template - Add how to test by @rchlfryn in https://github.com/NWACus/web/pull/854

### **⚙️ Infra/CI**

- Allowing a manual run of the production release workflow by @busbyk in https://github.com/NWACus/web/pull/844

## 1.4.0 — 2025-12-31

### **💫 Features**

- collections/Documents: allow other MIME types by @stevekuznetsov in https://github.com/NWACus/web/pull/829

### **⚙️ Infra/CI**

- Update deployment script to clean deployments and alias by @rchlfryn in https://github.com/NWACus/web/pull/822

## 1.3.0 — 2025-12-18

### **💫 Features**

- Remove observations disclaimer from the submit page by @busbyk in https://github.com/NWACus/web/pull/801
- Add external url validation to url fields for courses and events by @busbyk in https://github.com/NWACus/web/pull/803

### **🐛 Bug Fixes**

- Removing center slug from weather stations map heading by @busbyk in https://github.com/NWACus/web/pull/800
- Fix course bugs by @rchlfryn in https://github.com/NWACus/web/pull/806
- Admin updates - change logo description & affinity groups label by @rchlfryn in https://github.com/NWACus/web/pull/810
- Fix carousel loop by @rchlfryn in https://github.com/NWACus/web/pull/811

### **📚 Documentation**

- Changing docs link to a help link by @busbyk in https://github.com/NWACus/web/pull/802

### **⚙️ Infra/CI**

- Add versions to Diagnostics + add revalidate cache button by @busbyk in https://github.com/NWACus/web/pull/786

## 1.2.2 — 2025-12-16

### **⚙️ Infra/CI**

- Onboarding: SNFAC by @busbyk in https://github.com/NWACus/web/pull/796

## 1.2.1 — 2025-12-15

### **🐛 Bug Fixes**

- Bugfix: nac media block filter options by @busbyk in https://github.com/NWACus/web/pull/794

## 1.2.0 — 2025-12-13

### **💫 Features**

- Add weather forecast page by @rchlfryn in https://github.com/NWACus/web/pull/773
- Add NAC media widget as block by @rchlfryn in https://github.com/NWACus/web/pull/778
- A3 updates (docs, embed generator, logo) by @busbyk in https://github.com/NWACus/web/pull/789

### **🐛 Bug Fixes**

- Widget back behavior by @busbyk in https://github.com/NWACus/web/pull/726
- Update tenant slug readonly by @rchlfryn in https://github.com/NWACus/web/pull/774
- Update `View Providers` button link for provider emails by @rchlfryn in https://github.com/NWACus/web/pull/775
- Bugfix: enables the use of builtInPages in the navigation by @busbyk in https://github.com/NWACus/web/pull/781
- Use OG image API route instead of opengraph-image and twitter-image files by @busbyk in https://github.com/NWACus/web/pull/788

### **📚 Documentation**

- A3 Provides, Events and Courses dev docs updated by @busbyk in https://github.com/NWACus/web/pull/789

### **⚙️ Infra/CI**

- Fix tenant selector for global & readd to dashboard by @rchlfryn in https://github.com/NWACus/web/pull/768
- Bump next.js to 15.5.9 and payload to 3.68.3 by @busbyk in https://github.com/NWACus/web/pull/787
- Do not reformat importmap.js by @busbyk in https://github.com/NWACus/web/pull/784
- Clean up - Vercel, issue template, prettier for dependabot by @rchlfryn in https://github.com/NWACus/web/pull/791

## 1.1.1 — 2025-12-06

### **🐛 Bug Fixes**

- Bugfix: invite user drawer + Sentry config by @busbyk in https://github.com/NWACus/web/pull/764

## 1.1.0 — 2025-12-04

### **💫 Features**

- Update Sawtooths brand colors by @rchlfryn in https://github.com/NWACus/web/pull/749

### **🐛 Bug Fixes**

- Using slugs instead of ids for getEvents params by @busbyk in https://github.com/NWACus/web/pull/745
- Bug - fix events table long name, sortable header, and loading by @rchlfryn in https://github.com/NWACus/web/pull/756
- Update BlogList block by @rchlfryn in https://github.com/NWACus/web/pull/759

### **⚙️ Infra/CI**

- Bump Next.js and Payload versions by @busbyk in https://github.com/NWACus/web/pull/760

## 1.0.1 — 2025-12-03

### **💫 Features**

- Updating A3 emails by @busbyk in https://github.com/NWACus/web/pull/739

### **🐛 Bug Fixes**

- Bugfix: event page 404s by @busbyk in https://github.com/NWACus/web/pull/741

## 1.0.0 — 2025-12-03

Events and courses are now live!

### **💫 Features**

#### Events

- Events: groups and tags by @rchlfryn in https://github.com/NWACus/web/pull/636
- Events: change types and sub types by @rchlfryn in https://github.com/NWACus/web/pull/640
- Events location field by @busbyk in https://github.com/NWACus/web/pull/642
- Events: blocks single and list by @rchlfryn in https://github.com/NWACus/web/pull/653
- Events: improve imaging & info by @rchlfryn in https://github.com/NWACus/web/pull/652
- Events UI filters by @rchlfryn in https://github.com/NWACus/web/pull/648
- Events - fix filters by @rchlfryn in https://github.com/NWACus/web/pull/668
- Events group page and table by @rchlfryn in https://github.com/NWACus/web/pull/669
- Events UI Tweaks by @busbyk in https://github.com/NWACus/web/pull/697
- Events revalidation & migration by @rchlfryn in https://github.com/NWACus/web/pull/674
- Events - fix past dates shown on `/events` & change `Field Class` label by @rchlfryn in https://github.com/NWACus/web/pull/703
- Events date range filter re-implementation with fix by @busbyk in https://github.com/NWACus/web/pull/707
- Events - update types, skill level by @rchlfryn in https://github.com/NWACus/web/pull/719
- Events - fix table error & desktop nav z-index by @rchlfryn in https://github.com/NWACus/web/pull/716
- Events - do not use `dbName` & fix `futureDate` and `pastDate` by @rchlfryn in https://github.com/NWACus/web/pull/724
- Events & courses - remove latitude and longitude by @rchlfryn in https://github.com/NWACus/web/pull/727
- Event timezones on date fields by @busbyk in https://github.com/NWACus/web/pull/738
- Events & Courses by @rchlfryn in https://github.com/NWACus/web/pull/702

#### Courses

- A3 Providers and Courses by @busbyk in https://github.com/NWACus/web/pull/658
- A3 course provider embeds by @busbyk in https://github.com/NWACus/web/pull/675
- A3 embeds enhancements by @busbyk in https://github.com/NWACus/web/pull/693

## 0.0.10 — 2025-12-02

### **⚙️ Infra/CI**

- Setting engines.node to 22.x by @busbyk in https://github.com/NWACus/web/pull/732

## 0.0.9 — 2025-12-02

Fun updates to for the NAC observations widget & general updates as always

### **💫 Features**

- Observations disclaimer by @busbyk in https://github.com/NWACus/web/pull/721
- WidgetRouterHandler: allow deep linking to widget routes by @busbyk in https://github.com/NWACus/web/pull/718
- Single observation page by @busbyk in https://github.com/NWACus/web/pull/720

### **🐛 Bug Fixes**

- Bugfix: blank screen of death on block reorder when content block present by @busbyk in https://github.com/NWACus/web/pull/698
- hiding blocksInHighlightedContent field by @busbyk in https://github.com/NWACus/web/pull/699

### **⚙️ Infra/CI**

- Bump NAC widget version in seed script by @busbyk in https://github.com/NWACus/web/pull/700
- eslint.config.mjs: forbid `as` assertions by @stevekuznetsov in https://github.com/NWACus/web/pull/705

## 0.0.8 — 2025-11-20

### **🐛 Bug Fixes**

- Bugfix: widget styling enhancements by @busbyk in https://github.com/NWACus/web/pull/680
- Bugfix: svg mimetype check failing in seed by @busbyk in https://github.com/NWACus/web/pull/690

### **📚 Documentation**

- Docs: adding posthog authorized url instruction to onboarding docs by @busbyk in https://github.com/NWACus/web/pull/679

### **⚙️ Infra/CI**

- Group Payload deps dependabot PRs together by @busbyk in https://github.com/NWACus/web/pull/670
- Bump the payloadcms group with 16 updates by @dependabot[bot] in https://github.com/NWACus/web/pull/672
- Add blank issue template by @rchlfryn in https://github.com/NWACus/web/pull/688
- Migration snapshot diff script by @busbyk in https://github.com/NWACus/web/pull/689

## 0.0.7 — 2025-11-10

### **🐛 Bug Fixes**

- Bugfix: Bio photos can be uncentered in Team blocks by @busbyk in https://github.com/NWACus/web/pull/661
- Bugfix: Previews broken for pages, posts by @busbyk in https://github.com/NWACus/web/pull/664

### **📚 Documentation**

- Docs: updated one-liner for migration diff saved to file by @busbyk in https://github.com/NWACus/web/pull/663

## 0.0.6 — 2025-11-07

### **💫 Features**

- Multi-tenant user enhancements by @busbyk in https://github.com/NWACus/web/pull/649

### **🐛 Bug Fixes**

- Fix post preview avatars & hide date and/or authors on blocks if unchecked by @rchlfryn in https://github.com/NWACus/web/pull/651

### **⚙️ Infra/CI**

- Script to log PRs that haven't been released yet by @busbyk in https://github.com/NWACus/web/pull/641

## 0.0.5 — 2025-10-29

### **💫 Features**

- Migration safety by @busbyk in https://github.com/NWACus/web/pull/584
- Misc PR: enable prose, add button block to posts & slug validation by @rchlfryn in https://github.com/NWACus/web/pull/613
- Posts: option to hide author and date by @rchlfryn in https://github.com/NWACus/web/pull/619
- Update ISR settings by @rchlfryn in https://github.com/NWACus/web/pull/573
- Mobile tweaks by @busbyk in https://github.com/NWACus/web/pull/621
- Safely handle missing relationships + coding guide by @busbyk in https://github.com/NWACus/web/pull/594

### **🐛 Bug Fixes**

- Bugfix: global collection redirect loop by @busbyk in https://github.com/NWACus/web/pull/624
- Bug: corrects link for posts in handleReferenceURL by @rchlfryn in https://github.com/NWACus/web/pull/628
- Bugfix: Uncaught error on adding new content block by @busbyk in https://github.com/NWACus/web/pull/626
- Bugfix: all blocks with richText fields throw uncaught errors on initialization by @busbyk in https://github.com/NWACus/web/pull/638

### **⚙️ Infra/CI**

- Upgrade payload to v3.61.0 by @busbyk in https://github.com/NWACus/web/pull/629
- Upgrade payload to v3.61.1 by @busbyk in https://github.com/NWACus/web/pull/639

## 0.0.4 — 2025-10-14

### **🐛 Bug Fixes**

- Allow single ACs to see colors in color picker & improve column layout by @rchlfryn in https://github.com/NWACus/web/pull/591
- Still allow traffic to `/blog` if blog hidden from navigation by @busbyk in https://github.com/NWACus/web/pull/597

## 0.0.3 — 2025-10-13

### **💫 Features**

- Remove blank migration by @rchlfryn in https://github.com/NWACus/web/pull/569
- Remove @payloadcms/plugin-multi-tenant by @rchlfryn in https://github.com/NWACus/web/pull/570
- Upgrade to payload v3.58.0 & add view doc button by @rchlfryn in https://github.com/NWACus/web/pull/571
- Update sponsor block - remove banner option by @rchlfryn in https://github.com/NWACus/web/pull/575
- Hiding /theme-preview in production by @busbyk in https://github.com/NWACus/web/pull/593
- Remote pattern for www.sierraavalanchecenter.org by @busbyk in https://github.com/NWACus/web/pull/595
- Add posthog to navigation & breadcrumbs by @rchlfryn in https://github.com/NWACus/web/pull/572

### **🐛 Bug Fixes**

- Adding top-level await to payload scripts by @busbyk in https://github.com/NWACus/web/pull/588
- Select clause results in missing nested relationships by @busbyk in https://github.com/NWACus/web/pull/589

### **📚 Documentation**

- Add PR template by @rchlfryn in https://github.com/NWACus/web/pull/582
- Update PR template? by @rchlfryn in https://github.com/NWACus/web/pull/590

## 0.0.2 — 2025-10-02

### **💫 Features**

- Add progress bar on front end & increase upload file size by @rchlfryn in https://github.com/NWACus/web/pull/560
- Update sponsor blocks - add carousel and individual options by @rchlfryn in https://github.com/NWACus/web/pull/543
- Redirects updates by @busbyk in https://github.com/NWACus/web/pull/544
- Navigation top level nav items enabled toggle by @busbyk in https://github.com/NWACus/web/pull/566
- Update config for web settings and biographies by @rchlfryn in https://github.com/NWACus/web/pull/561
- Add formatting options to MediaBlock by @busbyk in https://github.com/NWACus/web/pull/559

### **🐛 Bug Fixes**

- Bugfix: Fixes hydration error in Avatars by @busbyk in https://github.com/NWACus/web/pull/545
- Bugfix: better initial hash handling for widgets by @busbyk in https://github.com/NWACus/web/pull/546
- Removing meta title field by @busbyk in https://github.com/NWACus/web/pull/550
- Bugfix: decode special characters from URL in breadcrumbs by @busbyk in https://github.com/NWACus/web/pull/551
- Bugfix: favicons weren't loading for center-scoped routes by @busbyk in https://github.com/NWACus/web/pull/547
- Generic embed block sizing by @busbyk in https://github.com/NWACus/web/pull/535
- Style updates - blogs and buttons block by @rchlfryn in https://github.com/NWACus/web/pull/562

### **📚 Documentation**

- Helper text / descriptions by @busbyk in https://github.com/NWACus/web/pull/549

## 0.0.1 — 2025-09-24

### **💫 Features**

- Update colors for Sierra rebrand by @rchlfryn in https://github.com/NWACus/web/pull/522
- Update blocks allowed on home page by @rchlfryn in https://github.com/NWACus/web/pull/529
- Built in pages by @rchlfryn in https://github.com/NWACus/web/pull/526

### **🐛 Bug Fixes**

- Bugfix: filter catch-all segment to published pages only by @busbyk in https://github.com/NWACus/web/pull/515
- Respect canonical urls in page route segments by @busbyk in https://github.com/NWACus/web/pull/516
- Clone parentMeta in generatMeta\_ functions by @busbyk in https://github.com/NWACus/web/pull/530
- Style updates for sponsor header, richtext bold & page bottom padding by @rchlfryn in https://github.com/NWACus/web/pull/521
- Warnings widget typo fix by @busbyk in https://github.com/NWACus/web/pull/532
- Generate static params for centers' active zones by @busbyk in https://github.com/NWACus/web/pull/531
- adding homePages to seed tenant scoped admin role in seed data by @busbyk in https://github.com/NWACus/web/pull/538

### **📚 Documentation**

- Update onboarding

### **⚙️ Infra/CI**

- Update Axios and Next.js by @dependabot[bot] in https://github.com/NWACus/web/pull/509
- Fix cleanup GHA @rchlfryn in https://github.com/NWACus/web/pull/523 https://github.com/NWACus/web/pull/524 https://github.com/NWACus/web/pull/525 https://github.com/NWACus/web/pull/541
- Custom domain handling in middleware by @busbyk in https://github.com/NWACus/web/pull/454

## 0.0.0 — 2025-09-24

**First release** - fun auto generated notes below... 🥇

- .github: fixup CI by @stevekuznetsov in https://github.com/NWACus/web/pull/42
- build(deps): bump axios from 1.7.7 to 1.8.2 in the npm_and_yarn group across 1 directory by @dependabot[bot] in https://github.com/NWACus/web/pull/44
- build(deps): bump prismjs from 1.29.0 to 1.30.0 in the npm_and_yarn group across 1 directory by @dependabot[bot] in https://github.com/NWACus/web/pull/43
- build(deps): bump @babel/runtime from 7.26.0 to 7.26.10 in the npm_and_yarn group across 1 directory by @dependabot[bot] in https://github.com/NWACus/web/pull/45
- build(deps): bump axios from 1.8.2 to 1.8.3 in the npm_and_yarn group across 1 directory by @dependabot[bot] in https://github.com/NWACus/web/pull/47
- \*: use sqlite for the database by @stevekuznetsov in https://github.com/NWACus/web/pull/55
- .github: add a production build to CI by @stevekuznetsov in https://github.com/NWACus/web/pull/58
- middleware: remove Payload query by @stevekuznetsov in https://github.com/NWACus/web/pull/59
- middleware: access Vercel public URL by @stevekuznetsov in https://github.com/NWACus/web/pull/60
- \*: add prod env, document env file by @stevekuznetsov in https://github.com/NWACus/web/pull/61
- Upgrade payload to 3.28.1 by @busbyk in https://github.com/NWACus/web/pull/66
- disabling all deployments on Vercel for now by @busbyk in https://github.com/NWACus/web/pull/69
- Decision docs by @busbyk in https://github.com/NWACus/web/pull/68
- adding instructions on signing commits by @busbyk in https://github.com/NWACus/web/pull/76
- Update readme by @rchlfryn in https://github.com/NWACus/web/pull/77
- Set first user as global admin by @busbyk in https://github.com/NWACus/web/pull/78
- \*: add Vercel Blob storage for media by @stevekuznetsov in https://github.com/NWACus/web/pull/87
- build(deps): bump next from 15.2.3 to 15.2.4 in the npm_and_yarn group across 1 directory by @dependabot[bot] in https://github.com/NWACus/web/pull/79
- Multi tenancy with Payload plugin + middleware and frontend routing updates by @busbyk in https://github.com/NWACus/web/pull/80
- prettier: organize imports by @stevekuznetsov in https://github.com/NWACus/web/pull/93
- tsconfig.json: enable strict mode for tsc by @stevekuznetsov in https://github.com/NWACus/web/pull/95
- Blocks: clean up unused blocks by @rchlfryn in https://github.com/NWACus/web/pull/111
- Navigation modeled in the admin panel by @busbyk in https://github.com/NWACus/web/pull/90
- .github: use an empty initial DB, initialize and seed at runtime by @stevekuznetsov in https://github.com/NWACus/web/pull/117
- .github: add workflows to run deployments by @stevekuznetsov in https://github.com/NWACus/web/pull/119
- .github: fix pipeline to deploy main branch by @stevekuznetsov in https://github.com/NWACus/web/pull/121
- .github: add one last token to vercel calls by @stevekuznetsov in https://github.com/NWACus/web/pull/122
- .github: fix domains, add a production deployment by @stevekuznetsov in https://github.com/NWACus/web/pull/123
- \*: DRY out server URL logic by @stevekuznetsov in https://github.com/NWACus/web/pull/125
- .github: stop trying to send commit message by @stevekuznetsov in https://github.com/NWACus/web/pull/126
- .github: hard code meta tags for ref by @stevekuznetsov in https://github.com/NWACus/web/pull/128
- package.json: run prettier after code generation by @stevekuznetsov in https://github.com/NWACus/web/pull/118
- Blocks: Add a list of images w/ text by @rchlfryn in https://github.com/NWACus/web/pull/84
- Forcing light mode by @busbyk in https://github.com/NWACus/web/pull/130
- .github: correctly identify the turso db to clean up by @stevekuznetsov in https://github.com/NWACus/web/pull/139
- \*: add biographies, teams by @stevekuznetsov in https://github.com/NWACus/web/pull/137
- \*: add a boostrap endpoint for minimal local dev work by @stevekuznetsov in https://github.com/NWACus/web/pull/145
- Update cn import to match payload by @rchlfryn in https://github.com/NWACus/web/pull/147
- Revert "\*: add a boostrap endpoint for minimal local dev work" by @rchlfryn in https://github.com/NWACus/web/pull/148
- Fix seed script by @rchlfryn in https://github.com/NWACus/web/pull/149
- Tailwind for admin components & add link by @rchlfryn in https://github.com/NWACus/web/pull/151
- decision doc for collection relation blocks approach by @busbyk in https://github.com/NWACus/web/pull/132
- Block: add layout option to `ImageTextList` by @rchlfryn in https://github.com/NWACus/web/pull/100
- setting devBundleServerPackages to false for faster dev compilation by @busbyk in https://github.com/NWACus/web/pull/152
- Seed pages by @busbyk in https://github.com/NWACus/web/pull/154
- Removing duplicate staff page by @busbyk in https://github.com/NWACus/web/pull/156
- Blocks: Link preview by @rchlfryn in https://github.com/NWACus/web/pull/141
- Semantic class names for themes + NWAC theme by @busbyk in https://github.com/NWACus/web/pull/157
- .github: start a db shell after creating db by @stevekuznetsov in https://github.com/NWACus/web/pull/165
- seed: add an incremental seed using hashes by @stevekuznetsov in https://github.com/NWACus/web/pull/168
- Preview environment aliases by @busbyk in https://github.com/NWACus/web/pull/170
- reseed.sh: spit out a useful error message by @stevekuznetsov in https://github.com/NWACus/web/pull/175
- scripts: fail on >400 HTTP codes in curl by @stevekuznetsov in https://github.com/NWACus/web/pull/177
- Update tsconfig to include noUnusedLocals by @rchlfryn in https://github.com/NWACus/web/pull/176
- endpoints: catch only at top level, fail on errors by @stevekuznetsov in https://github.com/NWACus/web/pull/178
- Pages: look up tenant during revalidation if necessary by @stevekuznetsov in https://github.com/NWACus/web/pull/180
- Blocks: image link grid by @rchlfryn in https://github.com/NWACus/web/pull/150
- Blocks: content by @rchlfryn in https://github.com/NWACus/web/pull/153
- Blocks - image text by @rchlfryn in https://github.com/NWACus/web/pull/166
- Set sans font to lato by @busbyk in https://github.com/NWACus/web/pull/182
- Blocks - image quote by @rchlfryn in https://github.com/NWACus/web/pull/167
- SAC theme by @busbyk in https://github.com/NWACus/web/pull/183
- Cherry-pick deployment improvements to main. by @stevekuznetsov in https://github.com/NWACus/web/pull/184
- \*: remove categories concept by @stevekuznetsov in https://github.com/NWACus/web/pull/186
- Remove heros by @busbyk in https://github.com/NWACus/web/pull/195
- Removing the concept of a 'home' route by @busbyk in https://github.com/NWACus/web/pull/196
- Local font for Lato by @busbyk in https://github.com/NWACus/web/pull/194
- Frontend Navigation by @busbyk in https://github.com/NWACus/web/pull/158
- Blocks: membership by @rchlfryn in https://github.com/NWACus/web/pull/185
- Update types and map from #185 by @rchlfryn in https://github.com/NWACus/web/pull/199
- Add ci job for generate:type and generate:importmap by @rchlfryn in https://github.com/NWACus/web/pull/202
- Update blog permissions by @rchlfryn in https://github.com/NWACus/web/pull/205
- NAC Widgets Enhancements by @busbyk in https://github.com/NWACus/web/pull/198
- NAC capabilities and metadata + forecast zones in navigation by @busbyk in https://github.com/NWACus/web/pull/208
- fixes serving block thumbnails from subdomains by @busbyk in https://github.com/NWACus/web/pull/211
- Middleware fix by @busbyk in https://github.com/NWACus/web/pull/212
- Bug: Fixes load error on page or post without a slug by @rchlfryn in https://github.com/NWACus/web/pull/204
- Footers for tenants by @rchlfryn in https://github.com/NWACus/web/pull/201
- Footer: Make icons clickable and on brand color by @rchlfryn in https://github.com/NWACus/web/pull/222
- Remove search by @rchlfryn in https://github.com/NWACus/web/pull/241
- NAC widget loading adjusted for manual mount control by @busbyk in https://github.com/NWACus/web/pull/224
- in-editor eslint warnings fix by @busbyk in https://github.com/NWACus/web/pull/253
- Rendering the first second-level nav item with sub items as open by default by @busbyk in https://github.com/NWACus/web/pull/252
- NAC widgets hash handling + observations form route by @busbyk in https://github.com/NWACus/web/pull/250
- removing unused link field by @busbyk in https://github.com/NWACus/web/pull/260
- Admin bar package updates by @busbyk in https://github.com/NWACus/web/pull/261
- only adding published \_status filter if draft state is false by @busbyk in https://github.com/NWACus/web/pull/259
- Website template cleanup | White labeling, metadata by @busbyk in https://github.com/NWACus/web/pull/258
- \*: tighten eslint rules, run in CI by @stevekuznetsov in https://github.com/NWACus/web/pull/262
- Blog - part 1 by @rchlfryn in https://github.com/NWACus/web/pull/233
- Bump brace-expansion from 1.1.11 to 1.1.12 in the npm_and_yarn group across 1 directory by @dependabot[bot] in https://github.com/NWACus/web/pull/266
- ImageMedia component enhancements by @busbyk in https://github.com/NWACus/web/pull/265
- Use compressed local images during seeding by @busbyk in https://github.com/NWACus/web/pull/272
- Better domain handling by @busbyk in https://github.com/NWACus/web/pull/270
- Use overrideAccess param default value by @busbyk in https://github.com/NWACus/web/pull/273
- Allow a basic user to view their profile page by @yuliadub in https://github.com/NWACus/web/pull/278
- Website template cleanup by @busbyk in https://github.com/NWACus/web/pull/277
- Use tenant scoped role assignments to determine users permissions by @busbyk in https://github.com/NWACus/web/pull/281
- updating sierra header and footer text colors to match figma designs by @busbyk in https://github.com/NWACus/web/pull/285
- minimal changes from slate for the sawtooth theme by @busbyk in https://github.com/NWACus/web/pull/286
- fixing scroll lock bug + making payload admin bar fixed by @busbyk in https://github.com/NWACus/web/pull/283
- Adjust roles for avalanche center roles by @busbyk in https://github.com/NWACus/web/pull/287
- Breadcrumbs by @busbyk in https://github.com/NWACus/web/pull/284
- Blog: Add tags & add sort for posts by @rchlfryn in https://github.com/NWACus/web/pull/271
- updating /posts/ routes to be /blog/ routes by @busbyk in https://github.com/NWACus/web/pull/320
- Vertical padding updates by @busbyk in https://github.com/NWACus/web/pull/319
- Fix relations fields to be tenant exclusive on posts by @rchlfryn in https://github.com/NWACus/web/pull/312
- Remove permissive read by @busbyk in https://github.com/NWACus/web/pull/321
- Global roles separation + role assignment UI enhancements by @busbyk in https://github.com/NWACus/web/pull/316
- Last login by @busbyk in https://github.com/NWACus/web/pull/324
- Adding permissive read back for the media collection by @busbyk in https://github.com/NWACus/web/pull/329
- hiding readOnly lastLogin field during create operations by @busbyk in https://github.com/NWACus/web/pull/328
- setting only routes generated by generateStaticParams to match by @busbyk in https://github.com/NWACus/web/pull/333
- Sentry integration by @busbyk in https://github.com/NWACus/web/pull/325
- truncating db names in turso create by @busbyk in https://github.com/NWACus/web/pull/337
- Bump @eslint/plugin-kit from 0.2.7 to 0.2.8 in the npm_and_yarn group across 1 directory by @dependabot[bot] in https://github.com/NWACus/web/pull/335
- User invite flow by @busbyk in https://github.com/NWACus/web/pull/323
- Add template tenant by @rchlfryn in https://github.com/NWACus/web/pull/322
- PostHog integration by @busbyk in https://github.com/NWACus/web/pull/326
- Users can only read and update self by @busbyk in https://github.com/NWACus/web/pull/338
- scoping the admin panel to a tenant based on subdomain or custom domain by @busbyk in https://github.com/NWACus/web/pull/336
- Migrations + production readiness by @busbyk in https://github.com/NWACus/web/pull/334
- Infra fixes by @busbyk in https://github.com/NWACus/web/pull/344
- actually masking generated password correctly by @busbyk in https://github.com/NWACus/web/pull/345
- installing vercel cli in prod to dev sync by @busbyk in https://github.com/NWACus/web/pull/346
- run migrations before db sanitization by @busbyk in https://github.com/NWACus/web/pull/347
- switching turso org in production workflow by @busbyk in https://github.com/NWACus/web/pull/348
- Remote image fallback in seed by @busbyk in https://github.com/NWACus/web/pull/349
- Restrict access to bootstrap and seed endpoints by @busbyk in https://github.com/NWACus/web/pull/350
- Bug: Change bio photo type by @rchlfryn in https://github.com/NWACus/web/pull/351
- Fix background color bug by @rchlfryn in https://github.com/NWACus/web/pull/342
- Migrate middleware to use edge config by @busbyk in https://github.com/NWACus/web/pull/359
- Fix updated at in seed script & unify page/post experience by @rchlfryn in https://github.com/NWACus/web/pull/352
- Fixes NAC widget/ navigation bug by @rchlfryn in https://github.com/NWACus/web/pull/362
- Improve desktop nav interaction by @rchlfryn in https://github.com/NWACus/web/pull/361
- Bump form-data from 4.0.2 to 4.0.4 in the npm_and_yarn group across 1 directory by @dependabot[bot] in https://github.com/NWACus/web/pull/364
- Blocks: Allow for unpopulated data & add missing thumbnails by @rchlfryn in https://github.com/NWACus/web/pull/360
- Add Suspense to blog by @rchlfryn in https://github.com/NWACus/web/pull/367
- Fix video rendering by @rchlfryn in https://github.com/NWACus/web/pull/365
- Bugfix: CSRF whitelist - include subdomains by @busbyk in https://github.com/NWACus/web/pull/366
- Escalation check by @busbyk in https://github.com/NWACus/web/pull/363
- adding getTenantFilter to remaining relationship type fields by @busbyk in https://github.com/NWACus/web/pull/368
- ignoring /assets urls from middleware to avoid rewriting those urls by @busbyk in https://github.com/NWACus/web/pull/369
- local flags for ISR testing locally by @busbyk in https://github.com/NWACus/web/pull/371
- Always use Edge Config in Payload config by @busbyk in https://github.com/NWACus/web/pull/372
- Nested error boundaries by @busbyk in https://github.com/NWACus/web/pull/376
- Sitemaps & Page/Post Revalidation by @busbyk in https://github.com/NWACus/web/pull/373
- Hide blog nav item if no published posts & unpublished pages/posts by @busbyk in https://github.com/NWACus/web/pull/374
- Revalidate everything by @busbyk in https://github.com/NWACus/web/pull/375
- Payload fixes/enhancements + workflow enhancements by @busbyk in https://github.com/NWACus/web/pull/393
- Dynamic OG images + Correct metadata for tenant-scoped routes by @busbyk in https://github.com/NWACus/web/pull/395
- used the wrong attribute to filter posts by tenant by @busbyk in https://github.com/NWACus/web/pull/397
- Add a bug template by @busbyk in https://github.com/NWACus/web/pull/401
- Onboarding docs by @busbyk in https://github.com/NWACus/web/pull/402
- Check if a migration is needed in CI by @busbyk in https://github.com/NWACus/web/pull/403
- Adds a build and deploy to sync-prod-to-dev workflow by @busbyk in https://github.com/NWACus/web/pull/410
- Bugfix: sync-prod-to-dev workflow by @busbyk in https://github.com/NWACus/web/pull/411
- Change behavior of editing slug for pages by @rchlfryn in https://github.com/NWACus/web/pull/370
- Allow everyone to submit a form by @rchlfryn in https://github.com/NWACus/web/pull/387
- Update lexical editor to include lists by @rchlfryn in https://github.com/NWACus/web/pull/412
- Footer updates - add secondary phone number slot by @rchlfryn in https://github.com/NWACus/web/pull/416
- Revalidation docs by @busbyk in https://github.com/NWACus/web/pull/423
- Improve multi tenant selector by @rchlfryn in https://github.com/NWACus/web/pull/386
- Fixes blocks spacing issues by @rchlfryn in https://github.com/NWACus/web/pull/419
- Remove archive forecast & update nav by @rchlfryn in https://github.com/NWACus/web/pull/420
- Minimize seed data by @rchlfryn in https://github.com/NWACus/web/pull/427
- Generic Embed Block by @busbyk in https://github.com/NWACus/web/pull/417
- Bugfix: Live previews by @busbyk in https://github.com/NWACus/web/pull/418
- Home page global collection by @busbyk in https://github.com/NWACus/web/pull/422
- Bugfix: handling missing home pages by @busbyk in https://github.com/NWACus/web/pull/429
- GenericEmbed block in home pages and posts content by @busbyk in https://github.com/NWACus/web/pull/438
- Bugfix: Embed block container width by @busbyk in https://github.com/NWACus/web/pull/439
- Bugfix: restricting image width and hiding overflow by @busbyk in https://github.com/NWACus/web/pull/440
- adding the align feature to our default lexical features by @busbyk in https://github.com/NWACus/web/pull/442
- Bugfix: adding MediaBlock to richText fields in all blocks by @busbyk in https://github.com/NWACus/web/pull/441
- Add seed images by @rchlfryn in https://github.com/NWACus/web/pull/445
- Blog List Block by @busbyk in https://github.com/NWACus/web/pull/428
- Single Blog Post Block by @busbyk in https://github.com/NWACus/web/pull/443
- Quick wins: block styling and admin view by @rchlfryn in https://github.com/NWACus/web/pull/447
- Add form option to footer by @rchlfryn in https://github.com/NWACus/web/pull/448
- Fix link bug by @rchlfryn in https://github.com/NWACus/web/pull/452
- Add sponsors collection and block by @rchlfryn in https://github.com/NWACus/web/pull/446
- Add revalidation for sponsors by @rchlfryn in https://github.com/NWACus/web/pull/473
- Add Header block by @rchlfryn in https://github.com/NWACus/web/pull/449
- Revert "Fix link bug" & update validation by @rchlfryn in https://github.com/NWACus/web/pull/475
- Update payload to v3.48.0 by @rchlfryn in https://github.com/NWACus/web/pull/474
- Add documentation link by @rchlfryn in https://github.com/NWACus/web/pull/479
- Add documents collection & block by @rchlfryn in https://github.com/NWACus/web/pull/451
- Quick fixes - links, buttons, y padding, headings by @rchlfryn in https://github.com/NWACus/web/pull/481
- Update style for team and bio blocks by @rchlfryn in https://github.com/NWACus/web/pull/482
- Add optional header to link preview by @rchlfryn in https://github.com/NWACus/web/pull/483
- Add concurrency to cancel build on multiple pushes by @rchlfryn in https://github.com/NWACus/web/pull/484
- General maintenance by @rchlfryn in https://github.com/NWACus/web/pull/485
- Add columns to content by @rchlfryn in https://github.com/NWACus/web/pull/486
- Add defaultValue for layout for content by @rchlfryn in https://github.com/NWACus/web/pull/490
- Content bugs when making Sierra pages by @rchlfryn in https://github.com/NWACus/web/pull/491
- .github: use normal Bash preamble for sanity by @stevekuznetsov in https://github.com/NWACus/web/pull/488
- Small content bugs by @rchlfryn in https://github.com/NWACus/web/pull/492
- Missing migration for blog list block by @rchlfryn in https://github.com/NWACus/web/pull/512

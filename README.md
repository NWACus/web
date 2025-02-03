# Avalanche Center Websites

```
# start local postgres
$ podman run --name payload --env POSTGRES_PASSWORD=password --env POSTGRES_USER=payload --publish 5432:5432 --detach postgres:17
# connect locally
$ PGPASSWORD=password psql -h localhost -p 5432 -U payload
# configure payload to use it
$ echo 'POSTGRES_URL=postgresql://payload:password@localhost:5432' >> .env
```


// TODO: hydration errors based on image src ...
// + srcSet={"/_next/image?url=http%3A%2F%2Fnwac.localhost%3A3000%2Fapi%2Fmedia%2Ffile%2Fi..."}
// - srcSet={"/_next/image?url=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fmedia%2Ffile%2Fimage-..."}


// TODO: rename tenant to avalanche center
// TODO: verify preview works
// TODO: publish to vercel
// TODO: sitemap updates
// TODO: once tenancy support is in (https://github.com/payloadcms/payload/pull/10447), mark tenant-globals non-list - Branding, App, etc - bump payload to v3.18.0
// TODO: ensure revalidation is done for every type of collection we have


// TODO: logo not rendering in the nav?
// TODO: fix sub-menu rendering - need to be at top, horizontal
// TODO: nav viewport should be larger
// TODO: model for weather station groups, list of groups into menu
// TODO: navigations, sections, groups should make sure no two children share a slug
// TODO: page rendering should walk the tree of segments to find the right page
// TODO: page slug uniqueness undo (or not, need for preview?)


// TODO: first login should be super-admin, how?>

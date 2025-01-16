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
// TODO: remove permissions based on cookie, as we're doing by baselistfilter now
// TODO: once tenancy support is in (https://github.com/payloadcms/payload/pull/10447), mark tenant-globals non-list - Branding, App, etc
// TODO: ensure revalidation is done


// TODO: fix sub-menu rendering
// TODO: model for weather station groups, list of groups into menu

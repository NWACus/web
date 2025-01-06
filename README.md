# Avalanche Center Websites

```
# start local postgres
$ podman run --name payload --env POSTGRES_PASSWORD=password --env POSTGRES_USER=payload --publish 5432:5432 --detach postgres:17
# connect locally
$ PGPASSWORD=password psql -h localhost -p 5432 -U payload
# configure payload to use it
$ echo 'POSTGRES_URL=postgresql://payload:password@localhost:5432' >> .env
```

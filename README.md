# Avalanche Center Websites

This repository holds the Next.js project powering a multi-tenant avalanche center website experience, using PayloadCMS v3 as a built-in CMS and Next.js app router for the front-end.

We use Next.js [middleware](https://github.com/NWACus/web/blob/main/src/middleware.ts) to dynamically rewrite requests from subdomains of the test or production site or from existing web properties of avalanche centers, allowing us to serve many tenants from one domain.

## Local Development

We use `sqlite` for local development since it's simple, allows us to store seed and test data easily, and has few dependencies.

When working on the front-end, it's possible to start with a seeded database and be up and running with no effort by using the in-repo seed database.

When changes to the schema or seed data need to occur, simply start with a new database and use a backup to update the seed database.

Once a database file is chosen and the development server is started, navigate to `localhost:3000/admin` and log in with `password:admin@avy.com` for a seeded site, or bootstrap the first user as necesary.

### Use the existing seeded database

When using the pre-existing seeded database, remember to make a local copy so changes are not committed unless you would like them to be.

```shell
cp dev.db{.seeded,}
echo "DATABASE_URI=file:dev.db" >> .env
pnpm dev
```

### Creating a new database

Start a new database with:

```shell
echo "DATABASE_URI=file:dev.db" >> .env
sqlite3 dev.db
```

Configure the database to use WAL mode with:

```sqlite
PRAGMA journal_mode=WAL;
.quit.
```

Start the development server with

```shell
pnpm dev
```

Navigate to the admin panel (localhost:3000/admin), create the first user, and seed the database.

### Update the seed database

Open the database that was just seeded:

```shell
rm dev.db.seeded
sqlite3 dev.db
```

Then, create a backup:

```sqlite
.backup main dev.db.seeded
.quit
```

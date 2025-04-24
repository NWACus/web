# Avalanche Center Websites

This repository holds the Next.js project powering a multi-tenant avalanche center website experience, using PayloadCMS v3 as a built-in CMS and Next.js app router for the front-end.

We use Next.js [middleware](https://github.com/NWACus/web/blob/main/src/middleware.ts) to dynamically rewrite requests from subdomains of the test or production site or from existing web properties of avalanche centers, allowing us to serve many tenants from one domain.

## Local Development

We use `sqlite` for local development since it's simple, allows us to store seed and test data easily, and has few dependencies.

When working on the front-end, it's possible to start with a seeded database and be up and running with no effort by using the in-repo seed database.

When changes to the schema or seed data need to occur, simply start with a new database and use a backup to update the seed database.

## First time setup

### Short-cut Bootstrapping

Run the `./bootstrap.sh` script, which will create a new database file for you, add a `boostrap@avy.com` user, and grant them super-admin rights to three tenants. Then, run `pnpm dev` and start work straight away by logging in as that first user.

### Creating a new database

Start a new database with:

```shell
echo "DATABASE_URI=file:./dev.db" >> .env
sqlite3 dev.db
```

In the database console, configure the database to use WAL mode with:

```sqlite
PRAGMA journal_mode=WAL;
.quit
```

Start the development server with

```shell
pnpm i
pnpm dev
```

### Phone a friend for secrets

**TODO: add to password manager**
You will need to add two keys to your `.env` file. Reach out to someone on the dev team.

### Set up subdomains on localhost

In order to use tenant scoped subdomains on localhost you'll need to add the following to your `/etc/hosts` on macOS or `C:\Windows\System32\drivers\etc\hosts` on Windows:

```
127.0.0.1       nwac.localhost
127.0.0.1       sac.localhost
127.0.0.1       snfac.localhost
```

### Access the app

Once a database file is chosen and the development server is started, navigate to the admin panel`localhost:3000/admin` and log in with `password:admin@avy.com` for a seeded site, or bootstrap the first user as necessary.

### Enabling pre-commit hook with Husky

This repo uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) to run a pre-commit hook that affects staged files. Our pre-commit hook formats staged files before committing. The `pnpm prepare` script should be automatically run after `pnpm install` which will configure the pre-commit hook to run on `git commit`.

If the pre-commit hook isn't running on your commits you can manually run `pnpm prepare`.

### Reviewing Pull Requests

Running the seed script may take a while - when reviewing a pull request, you can [download](https://docs.turso.tech/cli/installation) the `turso` CLI, [initialize the client](https://docs.turso.tech/cli/introduction) and clone the preview database locally instead:

```shell
# branch names may have illegal characters for turso database names, hence the shell magic
branch="skuznets/some-feature-thing" turso db shell payloadcms-preview-"${branch//[^a-z0-9\-]/x}" .dump | sqlite3 dev.db
```

## Git

### Signing commits

This repo on GitHub [requires signed commits](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) on the main branch.

To avoid an error when attempting to merge a PR on a feature branch into main, you should setup automatic commit signing:

1. Generate a GPG key (or use an existing one with the same name and email as your GitHub account): [GitHub guide](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key)
2. Add your GPG key to your GitHub account: [GitHub guide](https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account)
3. Configure git to use your GPG key: [GitHub guide](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key#telling-git-about-your-gpg-key)

Note: When configuring git to automatically sign commits you could leave out the `--global` flag if you only want to automatically sign commits in this repo, not all repos.

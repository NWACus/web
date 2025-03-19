# SQLite and Turso

Date: 2025-03-18

Status: accepted

## Context

Argument for SQLite is very well explained [here](https://github.com/epicweb-dev/epic-stack/blob/main/docs/decisions/003-sqlite.md).

We want local development to be easy. We want to be able to share data between developers easily. We want a database that can be used in a serverless environment since we're targeting Vercel. It would be great to support database branching.

## Decision

SQLite for local development and Turso for production accomplishes all of those things.

We can commit a seeded database to git for developers to use when getting started or working on a new branch.

## Consequences

Turso should provide solutions to avoid any of the potential challenges with using SQLite in a production serverless environment. Payload also supports using SQLite via an adapter.

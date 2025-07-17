# Persistent Environments Setup and File Storage Implications

Date: 2025-07-17

Status: proposed

## Context

Up to now we've been blowing away each environment's database, creating a new one, and re-seeding it with our seed script on each deploy. This has been nice because our database schema has been changing significantly.

We need to have a persistent production environment and we're at the point where our database schema is more stable and new changes will likely be additions rather than modifications of the existing schema.

Testing new code changes against production data provides certainty and is a good check before deploying to production.

We also have to consider file storage across environments. Up to now we've been using a single Vercel Blob store for all environments. This means that changing an image in one environment might affect the others.

## Decision

### Persistent environments

### File storage

## Consequences

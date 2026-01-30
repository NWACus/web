# Testing

WIP notes for e2e test suite

## Where we're at

This branch is very much a WIP.

Run `pnpm seed` and `pnpm dev` to get the dev server set up to make tests run a little faster.

Then run `pn test:e2e:ui` to manually run tests using the Playwright UI to get started/see the current state of things.

Currently the majority of the tests are failing but I figured I would just commit my changes and they can be picked up or not.

## Ideas

My main goal is to set up RBAC tests which log in as our various user types (super admin, multi-tenant role, single-tenant role, provider, provider manager) and we test what they can do.

I took inspiration from how Payload has their tests setup, copying several of their helper functions. See https://github.com/payloadcms/payload/blob/main/test

## Suggestions

I used Claude pretty heavily for this and haven't had a chance to review or reorganize things like I normally do. So feel free to change naming, reorganize files, etc. etc.

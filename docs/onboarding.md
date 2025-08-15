# Onboarding

This outlines steps required when a new center (tenant) comes on board. This doc is focused on the technical changes/tasks required but does mention things that a super admin will take care of as well.

## Checklist

### Code changes

- [ ] Create center's theme in `src/app/(frontend)/colors.css`
- [ ] Copy relevant theme colors to the `centerColorMap` in `src/utilities/generateOGImage.tsx`. We've been using the header colors.
- [ ] Seed data?

### Click ops / manual changes

We also need to get the new tenant into our Vercel Edge Config. Adding a new tenant in production *should* do this via a Payload hook but please verify the entry has been added by checking the Edge Config values in the Vercel dashboard (go to the project -> Storage -> production Edge Config).

- [ ] Create the new tenant in the production admin panel
- [ ] Fill out the new tenant's website settings
- [ ] Copy pages from the template tenant to the new tenant using the "Duplicate to..." functionality (page document view -> three dot menu)

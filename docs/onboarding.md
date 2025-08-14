# Onboarding

This outlines steps required when a new center (tenant) comes on board. This doc is focused on the technical changes/tasks required but does mention things that a super admin will take care of as well.

## Checklist

### Code changes

- [ ] Create center's theme in `src/app/(frontend)/colors.css`
- [ ] Copy relevant theme colors to the `centerColorMap` in `src/utilities/generateOGImage.tsx`. We've been using the header colors.
- [ ] Seed data?

### Click ops / manual changes

edge config
create in prod
copy pages over from template tenant

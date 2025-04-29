# Title

Date: 2025-04-18

Status: accepted

## Context

There are several sections that all ACs will have that will be dynamic based on their organization. These sections will have data that the AC admin(s) will need to populate based on their organization (i.e. staff, sponsors, etc.).

AC admins should be able to:
- control the order of collection entries
- update the underlying data in a single place

We need an approach/pattern for have collection-based data but provide control over content at a block-level that can be different on different pages, in different blocks.

## Decision

Approach: composable [blocks](https://payloadcms.com/docs/fields/blocks) with relationships to a collection.

These blocks would essentially be a light wrapper on top of the collection, which is the source of the data. Rather than storing data in the actual block, this stores the data in the collection so there can be many blocks referencing the same collection document. An admin could then just update the collection document and each block that references it would also be updated.

Here are a few variations we could have with "relation blocks". These should be composable, meaning they could be used standalone or as part of other blocks.

If we assume Biographies and Teams collections where Teams have a one-to-many relationship with Biographies, you could have a few different [Blocks](https://payloadcms.com/docs/fields/blocks) and associated components rendered by the RenderBlocks component:

1. Team (ordered automatically): Displays all Biographies related to the selected team. Displayed in the order returned by payload.
2. Biographies (ordered manually): Displays Biographies manually added by an editor in a specific order (using an array of Biography blocks). Could include a custom title/header and maybe a description for this too.
3. Biography: Displays a single Biography. Maybe this is used for the [highlight biography](https://www.figma.com/design/vAJkcFrHt5gddho3ILBOEx/NWAC-UX-UI-Redesign---Work?node-id=607-32819&t=wtJQPMoFAOzSW0Iy-4).

Variation 2 is for situations where an editor might want to highlight only some biographies, not necessarily grouped by team and control the order.

## Consequences

This introduces complexity into page revalidation because updating a collection updates the content on many pages. This consideration will be tracked under [#52](https://github.com/NWACus/web/issues/52).

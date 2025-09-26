# Truth behind Built-In Pages

Date: 2025-09-20

Status: accepted

## Context
There are a few pages in on our sites that "special" because they house NAC widgets. These pages are special because we do not want to allow anyone besides developers access to edit them.

We originally just hard coded these special pages in the navigation. This became an issue when users expect to reference navigation-visible pages through the "link block" feature for internal page linking, but our hard-coded approach prevented this functionality.


## Decision
We decided to define these special pages as "built-in" pages and made a collection for them.
- **Structure:** Each built-in page consists of a title and relative link
- **Edit permissions:** Only super admins can edit built-in pages
- **View permissions:** Tenant admins can view built-in pages
- **Integration:** Built-in pages are selectable in link blocks


## Consequences
- Navigation updates must be done in two places (navigation configuration and built-in page definitions)
- It is possible a non-dev super admin can accidentally make changes to these pages

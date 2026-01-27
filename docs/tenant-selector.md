# Tenant Selector

This document describes the tenant selector behavior in the Payload admin panel and provides manual test cases for verification.

## Overview

The tenant selector allows users with access to multiple avalanche centers to switch between tenants in the admin panel. It appears in the admin sidebar and controls:

1. Which tenant's documents are shown in list views
2. Which tenant is pre-selected when creating new documents
3. The `payload-tenant` cookie value

It also indicates which tenant a document is for in the document view.

## Collection Type Classifications

### Tenant-Required Collections

Collections with `tenantField()` but NOT `unique: true`. Each tenant can have multiple documents.

**Examples:** Pages, Posts, Media, Documents, Sponsors, Tags, Events, Biographies, Teams, Redirects

**Behavior:**
- List view: Filtered by selected tenant
- Document view: Tenant selector is read-only (locked to document's tenant)

### Global Collections (One Per Tenant)

Collections with `tenantField()` AND `unique: true`. Each tenant has exactly one document.

**Examples:** Settings, Navigations, HomePages

**Behavior:**
- Tenant selector remains enabled on document view
- Changing tenant redirects to that tenant's document

### Non-Tenant Collections

Collections without a tenant field. Documents are shared across all tenants.

**Examples:** Users, Tenants, GlobalRoles, GlobalRoleAssignments, Roles, Courses, Providers

**Behavior:**
- Tenant selector is hidden
- All documents visible (subject to user permissions)

### Payload Globals

Single-document globals (not collections).

**Examples:** A3Management, NACWidgetsConfig, Diagnostics

**Behavior:**
- Tenant selector is hidden
- Tenant cookie unchanged when visiting

## Manual Test Cases

### Test Matrix Dimensions

- **Collection types:** Tenant-required, Global collection, Non-tenant, Payload global
- **Roles:** Super admin, Multi-center admin, Single-center admin
- **Domains:** Root domain, Tenant subdomain

---

### Tenant-Required Collection (e.g., Pages, Posts)

#### List View

- [ ] The tenant selector should be visible and enabled
- [ ] Changing the tenant selector should filter the list to show only that tenant's documents
- [ ] The list should only show documents matching the selected tenant cookie

#### Document View (existing document)

- [ ] The tenant selector should be visible but disabled/read-only
- [ ] You should not be able to clear the tenant selector
- [ ] You should not be able to change the tenant selector
- [ ] Visiting a document should set the tenant cookie to that document's tenant field value
- [ ] The tenant field in the form should match the tenant selector value

#### Document View (create new)

- [ ] The tenant selector should be visible but disabled/read-only
- [ ] The tenant field should be pre-populated with the current cookie value

---

### Global Collection (e.g., Settings, Navigations, HomePages)

#### List View

- [ ] The tenant selector should be visible and enabled
- [ ] Changing the tenant selector should filter the list

#### Document View

- [ ] The tenant selector should be visible and enabled
- [ ] You should not be able to clear the tenant selector
- [ ] You should be able to change the tenant selector
- [ ] Changing the tenant selector should redirect to that tenant's document for this collection

---

### Non-Tenant Collection (e.g., Users, Tenants, GlobalRoles)

#### List View

- [ ] The tenant selector should be hidden
- [ ] Tenant cookie value should NOT be changed when visiting
- [ ] All documents should be visible (subject to user's access permissions)

#### Document View

- [ ] The tenant selector should be hidden
- [ ] Tenant cookie value should NOT be changed when visiting

---

### Payload Global (e.g., A3Management, NACWidgetsConfig)

- [ ] Tenant selector should be hidden
- [ ] Tenant cookie value should NOT be changed when visiting
- [ ] Document should be accessible regardless of current tenant cookie

---

### Dashboard View

- [ ] The tenant selector should be visible and enabled (if user has multiple tenants)
- [ ] Changing the tenant selector should update the cookie
- [ ] Dashboard widgets/recent documents should reflect the selected tenant

---

### Tenant-Optional Collection (if applicable)

- [ ] Visiting a document without a tenant cookie set and with a tenant field value set should set the tenant cookie to that tenant field value
- [ ] Visiting a document without a tenant cookie set and without the document's tenant field set should change neither the tenant selector nor the tenant field
- [ ] Visiting a document with a tenant cookie set and with a matching tenant field value should leave both unchanged
- [ ] Creating a document with no tenant selected should be allowed

---

## Role-Based Test Cases

### Super Admin

- [ ] Should see all tenants in the tenant selector dropdown
- [ ] Should be able to switch between any tenant
- [ ] Should have access to all collections including non-tenant ones

### Multi-Center Admin (user with roles in 2+ tenants)

- [ ] Should see only their assigned tenants in the dropdown
- [ ] Should be able to switch between their tenants
- [ ] Should NOT see tenants they don't have access to in the dropdown
- [ ] Attempting to manually navigate to a document from an unauthorized tenant should result in access denied

### Single-Center Admin (user with role in exactly 1 tenant)

- [ ] The tenant selector should be hidden (only 1 option available)
- [ ] The tenant cookie should automatically be set to their single tenant's value
- [ ] All tenant-scoped operations should use their single tenant

---

## Domain-Based Test Cases

### Root Domain (localhost:3000/admin)

- [ ] Tenant selector visible for multi-tenant users
- [ ] All tenant switching functionality works
- [ ] Cookie persists across navigation

### Tenant Subdomain (e.g., nwac.localhost:3000/admin)

- [ ] If domain-scoped deployment: tenant selector should be hidden
- [ ] Tenant should be automatically determined from subdomain
- [ ] User should only see documents for that subdomain's tenant

---

## Cookie Edge Cases

- [ ] **No cookie initially:** First admin visit should auto-select first available tenant
- [ ] **Invalid cookie value:** Cookie with non-existent tenant slug should fallback gracefully by auto-selecting first available tenant
- [ ] **Cookie persistence:** Cookie survives browser close/reopen (1-year expiration)
- [ ] **Cookie cleared:** Manually clearing cookie and revisiting admin should auto-select first available tenant

---

## Navigation & State Consistency

- [ ] **Browser back/forward:** Tenant state should remain consistent with URL/document
- [ ] **Direct URL access:** Navigating directly to a document URL should set correct tenant
- [ ] **Cross-collection navigation:** Switching from tenant-required to non-tenant collection should hide selector
- [ ] **Multiple tabs:** Changing tenant in one tab affects cookie, may affect other tabs on refresh
- [ ] **Login/logout:** Tenant state should persist after re-authentication

---

## Implementation Reference

Key files for the tenant selector implementation:

- `src/components/TenantSelector/TenantSelector.tsx` - Server component
- `src/components/TenantSelector/TenantSelector.client.tsx` - Client component with visibility logic
- `src/providers/TenantSelectionProvider/` - React context provider
- `src/fields/tenantField/TenantFieldComponent.tsx` - Form field integration
- `src/utilities/tenancy/` - Cookie and tenant resolution utilities

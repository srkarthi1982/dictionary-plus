# App Spec: dictionary-plus

## 1) App Overview
- **App Name:** Dictionary+
- **Category:** Language / Reference
- **Version:** V1
- **App Type:** DB-backed
- **Purpose:** Let an authenticated user maintain a personal dictionary of terms, definitions, notes, and favorites.
- **Primary User:** A signed-in user maintaining a private reference library.

## 2) User Stories
- As a user, I want to add dictionary entries, so that I can keep my own searchable term library.
- As a user, I want to favorite and archive entries, so that I can organize active and important terms.
- As a user, I want to open an entry detail route safely, so that I can review the saved record without route crashes.

## 3) Core Workflow
1. User signs in and opens `/app`.
2. User creates a dictionary entry in the workspace.
3. App stores the entry in the user-scoped database and lists it in the workspace.
4. User searches, filters, favorites, archives, or restores entries from the workspace and detail route.
5. User refreshes or revisits the app and continues from the persisted state.

## 4) Functional Behavior
- Entry records are stored per authenticated user in the app database.
- The app supports create, search/filter, favorite, archive, restore, and detail viewing; delete is not part of V1.
- `/app` is protected and redirects to the parent login flow when unauthenticated.
- Invalid or unauthorized direct entry URLs fail safely instead of returning `500`.

## 5) Data & Storage
- **Storage type:** Astro DB on the app’s isolated Turso database
- **Main entities:** Dictionary entries
- **Persistence expectations:** User-owned entries persist across refresh and new sessions.
- **User model:** Multi-user shared infrastructure with per-user isolation

## 6) Special Logic (Optional)
- The app is a personal reference workspace, not an external public lookup service in the current implementation.
- Search and filter behavior operate over the user’s stored entries, not an external dictionary API.

## 7) Edge Cases & Error Handling
- Invalid IDs/routes: Non-matching or invalid entry routes are handled safely and do not return `500`.
- Empty input: Invalid create payloads should be rejected without storing broken entries.
- Unauthorized access: `/app` redirects to the parent login flow.
- Missing records: Missing or non-owned entries are not exposed to the user.
- Invalid payload/state: Workspace actions fail safely without breaking the stored list.

## 8) Tester Verification Guide
### Core flow tests
- [ ] Create an entry, search for it, and confirm it appears in the workspace list.
- [ ] Favorite the entry, archive it, restore it, and confirm the changes are reflected after refresh.

### Safety tests
- [ ] Open an invalid entry detail URL and confirm the app handles it safely without a crash.
- [ ] Open the same detail URL as another user and confirm cross-user access is blocked.
- [ ] Refresh after changes and confirm the stored entry state persists.

### Negative tests
- [ ] Confirm there is no server-backed public lookup mode in V1.
- [ ] Confirm invalid route inputs do not produce `500` responses.

## 9) Out of Scope (V1)
- External live dictionary API lookups
- Hard delete of stored entries
- Shared or collaborative dictionaries

## 10) Freeze Notes
- V1 release freeze: this document reflects the verified authenticated personal dictionary behavior.
- Freeze Level 1 verification confirmed create, search/filter, favorite, detail open, archive/restore, refresh behavior, invalid-route safety, and cross-user protection.
- During freeze, only verification fixes and cleanup are allowed; no undocumented feature expansion.

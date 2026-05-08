## Plan: iPark Web Application Implementation

Build the iPark Smart Parking Management System frontend (Next.js/React + Tailwind CSS) establishing a flexible dashboard architecture, role-based UI permissions, and a hybrid mocked database system.

**Steps**

**Phase 1: Project Initialization & Mock Backend**
1. Initialize Next.js project with TypeScript and Tailwind CSS. (DONE)
2. Setup global routing structure for core pages: `/login`, `/dashboard`, `/parks`, `/staffs`, `/events`, `/settings`. (DONE)
3. Create global layout wrapper implementing "modern curve shapes" aesthetic. (DONE)
4. Implement hybrid database layer using React Context or Zustand using definitions from [docs/iPark.md](docs/iPark.md): (DONE)
   - Mocks (Read-only): `PARK_DB`, `STAFF_DB`, `GROUP_DB`, `EVENT_DB`, `DASHBOARD_DB`.
   - Mutable Store: `USER_DB`, `EVENT_HISTORY_DB`, `SYSTEM_STATE_DB`.

**Phase 2: Authentication & Security Flow**
5. Build the Login View. *Depends on 4.* (DONE)
6. Implement mock authentication logic checking against `USER_DB`. (DONE)
7. Implement security threshold: 5 invalid attempts initiates a 30-minute block and logs an incident to `EVENT_HISTORY_DB`. (DONE)
8. Create "Forgot Password" mock dialog. (DONE)

**Phase 3: Core Dashboard & Widget Engine**
9. Implement the Dashboard View wrapper with a dropdown for dashboard selection and edit/pin actions based on user permissions. *Depends on 6.* (DONE)
10. Build the Grid Layout system for widgets reading `x`, `y`, `w`, `h` from `DASHBOARD_DB`. (DONE)
11. Scaffold base widget component handling rounded UI, titles, and unified empty/error states. (DONE)
12. Implement specific widget data sinks (PARK, FEE, STAFF, WORKING TIME, EVENT, ACTION, MISC) mapping their `data_source` constraints. *parallel with step 11*. (DONE)

**Phase 4: Entity Management Views**
13. Build Parks Table View rendering `PARK_DB`. (DONE)
14. Build Staff Table View rendering `STAFF_DB`. (DONE)
15. Build Events Table View rendering `EVENT_HISTORY_DB`. (DONE)
16. Implement standard quick actions for tables (View, Add, Edit, Delete), conditionally rendering them based on the active user’s `GROUP_DB` permissions. *Depends on 13, 14, 15*. (DONE)

**Phase 5: Settings & State Mutation**
17. Build Settings page structures: Notifications interface, Language/Theme toggles, and Account Management table. (DONE)
18. Connect Account Management table to mutable `USER_DB` (handling password/email edits, add/delete, enable/disable). (DONE)
19. Hook `SYSTEM_STATE_DB` mutators to ACTION/SWITCH widgets (e.g. toggling maintenance mode and prompting for admin password). (DONE)

**Phase 7: UI/UX Finalization & Branding**
26. **Branding Alignment**: Replace generic placeholder logos with project-specific iPark logo asset across Login and Sidebar. (DONE)
27. **Iconic Settings**: Add visual anchors (icons) to all sections in the Settings page for improved scannability. (DONE)
28. **Robust Bulk Actions**: Replace native browser `confirm()` with a themed `ConfirmDialog` for bulk deletions. (DONE)
29. **About & Metadata**: Implement an "About" section in Settings to track build versions and developer credits. (DONE)
30. **Password Security UX**: Add hide/show toggles to all password input fields. (DONE)

**Verification**
...
9. Verify branding consistency across all entry points and navigation menus. (VERIFIED)
10. Confirm bulk actions trigger the custom themed dialog instead of browser defaults. (VERIFIED)
11. Validate password toggle functionality in both Login and Settings forms. (VERIFIED)

**Decisions**
...
- **Branding Strategy**: Centralized logo assets in `public/` for consistent reference across Next.js metadata and React components.
- **Dialog System**: Programmatic control of `ConfirmDialog` via state instead of blocking window calls.
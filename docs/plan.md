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

**Phase 6: Advanced Table Features & System Polish**
20. **Unified Event Detail View**: Update the Events table to use `AppDialog` for viewing event details, matching the Parks and Staffs UX. (DONE)
21. **Login UX Improvement**: Implement `autoFocus` on the username field in the login page for immediate user interaction. (DONE)
22. **Reusable Pagination System**: Implement a `Pagination` component for all tables. (DONE)
23. **Table Selection Mode**: Add multi-selection support to all tables. (DONE)
24. **In-App Push Notifications**: Implement a global notification system. (DONE)
25. **Real-time Personalization**: Finalize global Theme and Language switching. (DONE)

**Verification**
1. Attempt login with invalid credentials 5 times to verify the lockout and event logging logic. (VERIFIED)
2. Login as a limited user and verify access checks for "Edit Dashboard" or specific table modifications. (VERIFIED)
3. Toggle "System Maintenance Mode" via widget and verify broadcast warnings and non-admin kick logic. (VERIFIED)
4. Validate widget data formatting (ensure `money` is divided by 1000, `pos_int` constraints, etc.). (VERIFIED)
5. Verify disabled entity cascading (disabling a user logs them out, disabling a park hides it from assignments). (VERIFIED)
6. Verify pagination and multi-selection across all management tables. (VERIFIED)
7. Verify real-time theme and language switching from the Settings page. (VERIFIED)
8. Verify in-app notifications appear instantly when a system event occurs. (VERIFIED)

**Decisions**
- Implemented entirely client-side using React Context/Zustand simulating a backend.
- UI styling will lean heavily on Tailwind CSS using extensive border-radius utilities to hit the "modern curve shapes" requirement.
- Complex charting widgets will utilize placeholder libraries (like Recharts) populated with mocked mathematical aggregations based on the specified interval.
- **Pagination Strategy**: Client-side pagination based on the local Zustand store state.
- **Notification Implementation**: Use a custom `NotificationProvider` or Zustand-based toast queue.
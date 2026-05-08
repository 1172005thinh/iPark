# CHANGELOG

## [0.5.0] — 2026-05-08 — Phase 5: Settings & Live Data Expansion

### Summary

Completed **Phase 5** — confirmed Settings and system-state wiring, expanded the live database model to cover all tables, and unified dashboard dialogs with the shared modal components.

### Added

- **Dashboard dialogs** now use the shared `AppDialog` and `ConfirmDialog` components for add/delete actions.

### Changed

- **Events View (`/events`)** now maps park names from the live `PARK_DB` store to reflect park edits immediately.
- **Database documentation** updated to reflect that all tables are live-editable during the demo session.

### Fixed

- Corrected invalid event code `00c` to `012` in `EVENT_DB` and `EVENT_HISTORY_DB` seed data to comply with the 3-digit format rule.

---

## [0.4.0] — 2026-05-08 — Phase 4: Entity Management Views

### Summary

Completed **Phase 4** — implemented the Entity Management Views for Parks, Staffs, and Events, integrating standard quick actions with permission-based conditional rendering.

### Added

- **Parks View (`/parks`)**:
  - Added conditional standard quick actions column.
  - Implemented Add (top-level), View, Edit, and Delete action buttons per row.
  - Action visibility is strictly controlled by `add_parks`, `view_parks`, `edit_parks`, and `delete_parks` permissions from the active user's `GROUP_DB`.
- **Staffs View (`/staffs`)**:
  - Added conditional standard quick actions column.
  - Implemented Add (top-level), View, Edit, and Delete action buttons per row.
  - Action visibility is strictly controlled by `add_staffs`, `view_staffs`, `edit_staffs`, and `delete_staffs` permissions.
- **Events View (`/events`)**:
  - Enhanced the existing table with a conditional Export CSV button at the top (requires `export_events` permission).
  - Added a conditional Actions column with a Delete button per row and inside the Event Detail view (requires `delete_events` permission).
  - The Delete action correctly mutates the `EVENT_HISTORY_DB` Zustand store.

---

## [0.3.1] — 2026-05-07 — Phase 3 Verification & Datasource Compliance

### Summary

Verified Phase 3 completion against `docs/iPark.md` datasource specifications. Fixed **6 widget datasource compliance issues** where widgets used hardcoded mock values instead of deriving data from the actual database stores. All widgets now read from `PARK_DB`, `STAFF_DB`, and `SYSTEM_STATE_DB` as specified.

### Fixed (Datasource Compliance)

- **`ParkWidgets.curr_slot_max_slot`**: Was hardcoded to `/ 100`. Now reads `max_slot` from `PARK_DB`, aggregating all enabled parks when `park = 'ALL'` (result: 650 for 3 enabled parks: 200+150+300, correctly excluding disabled `west_park`).
- **`ParkWidgets.stats_curr_slot`**: Was hardcoded to 12/45/98. Now derives lowest/avg/highest as percentages of `totalMaxSlot` from `PARK_DB`.
- **`FeeWidgets.curr_fee`**: Was hardcoded to `2,500 VND`. Now reads `fee` field from `PARK_DB` for the specified park. Central Park = 2,000 VND, North Park = 2,500 VND (money type, stored as integer).
- **`FeeWidgets.estimate_income`**: Was hardcoded to `8,450,000`. Now computes `fee × floor(max_slot × 0.4)` per park, reflecting actual park fee and capacity.
- **`WorkingTimeWidgets.start_end_time`**: Was hardcoded to `06:00 / 22:00`. Now reads `start_time`/`end_time` from `PARK_DB` (e.g., Central Park: 06:00–18:00, North Park: 07:00–19:00).
- **`WorkingTimeWidgets.curr_total_working_time`**: Was hardcoded to `112h`. Now calculates real shift duration from `PARK_DB` start/end times.
- **`StaffWidgets.curr_staff_max_staff`**: Was hardcoded to `/ 10`. Now counts enabled staff from `STAFF_DB` filtered by `park`, using `is_on_shift` for current count and `is_enable` for total. (All Parks: 3 on shift / 5 enabled).
- **`ActionWidgets.switch`**: Was a disconnected local state toggle. Now reads initial state from `SYSTEM_STATE_DB` Zustand store and calls correct mutations (`toggleLights`, `toggleCameras`, `toggleSensors`, `toggleMaintenanceMode`, `toggleEmergencyMode`). Dangerous switches (cameras off, sensors off, maintenance mode, emergency mode) show confirmation dialogs.

### Added

- All chart widgets now use `useMemo` for stable random seed data to prevent re-render flickering.
- Chart x-axis labels now adapt to `interval` (Day/Hour/Week/Month prefix).

### Live Test Results (via browser agent)

| Check | Result |
|---|---|
| Login (admin/Admin@123) | ✅ Pass |
| `curr_slot_max_slot` shows 650 total (not hardcoded 100) | ✅ Pass |
| `curr_slot_max_slot` excludes disabled `west_park` | ✅ Pass |
| `curr_staff_max_staff` shows 3/5 from real STAFF_DB | ✅ Pass |
| `list_event` reads from EVENT_HISTORY_DB | ✅ Pass |
| Dashboard dropdown switches between 3 dashboards | ✅ Pass |
| Operations Dashboard shows real `start_end_time` (06:00–18:00) | ✅ Pass |
| Edit Layout toggle / "Edit Mode Active" badge | ✅ Pass |
| No fatal console errors | ✅ Pass |

---

## [0.3.0] — 2026-05-07 — Phase 3: Core Dashboard & Widget Engine

### Summary

Completed **Phase 3** — implemented the dynamic dashboard layout system and all widget data sinks. The dashboard now fully supports rendering multiple dashboards from `DASHBOARD_DB` with drag-and-drop layout editing.

### Added

- **Dashboard Layout Engine (`react-grid-layout`)**:
  - Implemented `DashboardGrid` component acting as a responsive grid wrapper.
  - Added Edit Mode toggle (restricted by `edit_dashboard` permission).
  - Implemented dashboard selection dropdown supporting multiple dashboards.
- **Widget Routing (`WidgetRenderer.tsx`)**:
  - Acts as a factory mapping `data_source.category` to specific widget components.
- **Widget Implementations (`src/components/dashboard/widgets/`)**:
  - `ParkWidgets`: `curr_slot_max_slot`, `stats_curr_slot`, `chart_curr_slot`.
  - `FeeWidgets`: `curr_fee`, `estimate_income`, `chart_estimate_income`.
  - `MiscWidgets`: `curr_time` (real-time clock), `curr_weather` (static mock).
  - `StaffWidgets`: `curr_staff_max_staff`, `stats_curr_staff`, `chart_curr_staff`, `estimate_payment`, `chart_estimate_payment`.
  - `WorkingTimeWidgets`: `start_end_time`, `curr_total_working_time`, `stats_curr_total_working_time`, `chart_curr_total_working_time`.
  - `EventWidgets`: `curr_event` (reads from `EVENT_HISTORY_DB`), `list_event` (scrollable recent list), `count_type_event`.
  - `ActionWidgets`: `action` (processing buttons for `fire_alarms` etc.), `switch` (toggles for maintenance/lights).
- **Chart Library (`recharts`)**:
  - Implemented responsive line charts for historical/trend data representation.

## [0.2.0] — 2026-05-07 — Phase 2: Authentication & Security Flow

### Summary

Completed **Phase 2** — all tasks (Steps 5–8) were implemented during Phase 1 as part of the login page and auth store foundation. This release formally closes Phase 2 with no additional code changes.

### Phase 2 Tasks (All Pre-completed)

- **Step 5 — Login View**: Full login page at `/login` with username/password form, loading states, auto-redirect if already authenticated, demo credential hints.
- **Step 6 — Mock Auth Logic**: `auth-store.ts` validates credentials against `USER_DB` via `getUserByName()`, resolves permissions from `GROUP_DB`, manages session state.
- **Step 7 — Security Threshold**: 5 invalid login attempts trigger a 1-minute IP block (configurable, docs allow short demo duration). Failed logins log event `005` ("Login Failed"), 5th failure logs event `006` ("IP Blocked") to `EVENT_HISTORY_DB`. Successful login logs event `007` ("User Logged In").
- **Step 8 — Forgot Password**: Modal dialog with email field, looks up user by email in `USER_DB`, resets password to `Password@123`.

### Deployment

- Rebuilt Docker container `ipark` to pick up Phase 1 code changes.
- Verified live domain `https://ipark.hungthinhcloud.freeddns.org` via NPM proxy → `http://ipark:3000`.
- Added iPark card to HungThinhCloud homepage with sky-blue theme and car icon.

---

## [0.1.0] — 2026-05-07 — Phase 1: Project Initialization & Mock Backend

### Summary

Completed **Phase 1** of the iPark Smart Parking Management System implementation plan.
Established the full project foundation: routing structure, global layout with "modern curve shapes" aesthetic, TypeScript type definitions, mock data for all 8 database tables, and Zustand-based state management for the 3 mutable datastores.

---

### Added

#### Project Structure & Routing
- **Route group `(app)/`** — Authenticated shell layout wrapping all protected pages with sidebar + auth guard.
- **`/login`** — Full login page (username/password form, "Forgot Password" dialog with email-based reset, demo credential hints).
- **`/` (root)** — Server-side redirect to `/login` (landing page per docs).
- **`/dashboard`** — Dashboard page with quick stat cards and placeholder widget grid (Phase 3).
- **`/parks`** — Parks table view with sortable columns, status badges, reading from `PARK_DB`.
- **`/staffs`** — Staffs table view with park name resolution, sortable columns, reading from `STAFF_DB`.
- **`/events`** — Events table view reading mutable `EVENT_HISTORY_DB`, with acknowledge-on-click, detail panel, and type badges.
- **`/settings`** — Settings page with notification toggles, language/theme radio selectors, and Phase 5 account management placeholder.

#### Type Definitions (`src/types/database.ts`)
- Complete TypeScript interfaces for all 8 database tables: `User`, `Group`, `Park`, `Staff`, `EventDef`, `EventHistory`, `Dashboard`, `SystemState`.
- Widget data source types covering all 7 categories: `PARK`, `FEE`, `STAFF`, `WORKING_TIME`, `EVENT`, `ACTION`, `MISC`.
- Branded type aliases for custom data types: `PosInt`, `Money`, `ErrCode`, `EventCodeId`, `ObjectName`, `Password`, `Email`, `DateTime`, `Time`, `DateStr`.
- `Permission` union type enumerating all 17 system permissions.
- `AuthSession` and `LoginAttemptTracker` interfaces for authentication state.

#### Mock Data (Read-Only) (`src/data/`)
- **`mock-groups.ts`** — 3 groups: `admins` (17 permissions), `users` (5 permissions), `managers` (9 permissions).
- **`mock-parks.ts`** — 4 parks including 1 disabled park demonstrating cascade logic (`is_enable=false → is_operating=false`).
- **`mock-staffs.ts`** — 6 staff members including 1 disabled staff demonstrating cascade logic.
- **`mock-events.ts`** — 15 pre-defined system event types (login, park, staff, system events).
- **`mock-dashboards.ts`** — 3 dashboards (admin overview, staff dashboard, operations) with pre-configured widget JSON layouts.

#### State Management (Mutable Stores) (`src/stores/`)
- **`user-store.ts`** — `USER_DB` Zustand store with 4 seed users, CRUD operations, `setOnline`/`disableUser`/`enableUser` with cascade enforcement.
- **`event-history-store.ts`** — `EVENT_HISTORY_DB` Zustand store with 10 seed events, `addEvent`/`acknowledgeEvent`/`deleteEvent` operations.
- **`system-state-store.ts`** — `SYSTEM_STATE_DB` Zustand store with global + 3 park states, toggle operations for maintenance/emergency modes and per-park devices.
- **`auth-store.ts`** — Authentication store with login flow, 5-attempt IP blocking (1 min demo), event logging on failed/successful logins, permission resolution from `GROUP_DB`, logout.

#### UI Components
- **`Sidebar.tsx`** — Sidebar navigation with iPark branding, 5 nav links with active-state highlighting, user info, logout button, inline SVG icons.
- **`AuthGuard.tsx`** — Route protection wrapper that redirects unauthenticated users to `/login`.

#### Styling (`globals.css`)
- iPark design token system (CSS custom properties): colors, curves, shadows.
- Modern curve shapes classes: `.ip-card` (rounded-2xl), `.ip-widget` (rounded-lg), `.ip-btn` (rounded-md), `.ip-input`.
- Sidebar styles with hover/active states.
- Custom scrollbar styling.
- `fadeIn` and `slideInLeft` CSS animations.
- Dark mode support via `prefers-color-scheme` media query.

### Changed

- **`package.json`** — Added `zustand` dependency for client-side state management.
- **`src/app/layout.tsx`** — Updated metadata (`title`, `description`), applied iPark design tokens to body.
- **`src/app/page.tsx`** — Replaced default Next.js page with redirect to `/login`.
- **`src/app/globals.css`** — Complete rewrite with iPark design system (replacing default Next.js boilerplate).

### Technical Decisions

- **Zustand over React Context** — Chosen for simpler API, no provider nesting, and built-in selectors for the hybrid database architecture.
- **Route group `(app)/`** — Used Next.js route groups to share the sidebar layout across authenticated pages while keeping `/login` layout-free.
- **Client Components** — All interactive pages use `'use client'` directive; data stores are client-side only (no server state needed for demo).
- **1-minute IP block** — Reduced from 30 minutes (per docs note: *"can be 1 minute for short demonstration"*).
- **Tailwind CSS v4** — Using `@theme inline` for custom color tokens (v4 syntax per project config).

### Database Compliance (per `docs/iPark.md` Section 7)

| Database | Mutability | Store | Records |
|---|---|---|---|
| `USER_DB` | ✅ Mutable | `user-store.ts` | 4 users |
| `GROUP_DB` | ❌ Read-only | `mock-groups.ts` | 3 groups |
| `PARK_DB` | ❌ Read-only | `mock-parks.ts` | 4 parks |
| `STAFF_DB` | ❌ Read-only | `mock-staffs.ts` | 6 staff |
| `EVENT_DB` | ❌ Read-only | `mock-events.ts` | 15 events |
| `EVENT_HISTORY_DB` | ✅ Mutable | `event-history-store.ts` | 10 records |
| `DASHBOARD_DB` | ❌ Read-only | `mock-dashboards.ts` | 3 dashboards |
| `SYSTEM_STATE_DB` | ✅ Mutable | `system-state-store.ts` | 4 states |

### Cascade Rule Enforcement

- `is_enable=false` → `is_operating=false` (Parks: west_park)
- `is_enable=false` → `is_on_shift=false` (Staff: peter_le)
- `is_enable=false` → `is_online=false` (Users: disabled_user, enforced in `disableUser()`)

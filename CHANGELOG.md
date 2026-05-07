# CHANGELOG

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

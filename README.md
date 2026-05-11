# iPark - Smart Parking Management System

**iPark** is a modern, comprehensive web-based management solution designed for parking facilities. Built with performance and scalability in mind, it provides administrators and staff with real-time insights into occupancy, revenue, and system health across multiple parking zones.

---

## ⚠️ Important: Demo Phase Notice

Please be advised that iPark is currently in its **Demo Phase (v1.5)**. 

- **Fake Backend & Database**: All data is currently served via internal mock stores (Zustand) and does not persist across server restarts or connect to a real SQL/NoSQL database.
- **In-Progress UI**: While the core dashboard and management pages are functional, several UI components and interactive dialogs are still being refined.
- **Limited Real-time Data**: Financial projections and certain staffing metrics are based on simulation templates rather than live sensor data.

## 🛠️ Acknowledged Issues

We are committed to transparency. The following issues are known and currently being addressed:

1. **Staff Summary**: The enabled staff count on the dashboard may not always reflect live shift changes.
2. **Mock Data**: Financial metrics currently use static mock sources.
3. **Localization**: Translation gaps exist in several popup dialogs and login error messages.
4. **Layout**: Minor visual glitches in the Users table and specific mobile views.
5. **Notification Latency**: Toasts may require a specific event history threshold to trigger reliably.

*For a detailed list of bugs and planned fixes, please see [PROBLEM.md](PROBLEM.md).*

---

## 🏗️ Technical Stack

- **Framework**: [Next.js 14+](https://nextjs.org) (App Router)
- **Styling**: Tailwind CSS & Vanilla CSS for premium aesthetics
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: Lucide React
- **Language**: TypeScript

---

## 👥 The Development Team

Developed with ❤️ by the **TICSMTC - HCMUT 3rd-year CSE Group**. 

This project represents our journey in learning advanced web architectures and building scalable enterprise-grade interfaces.

### 🙏 Special Thanks

We would like to express our deepest gratitude to the AI assistants that helped us navigate complex coding challenges and UI design decisions:
- **Claude**
- **Gemini**
- **Codex**

Their pair-programming assistance has been invaluable in reaching this milestone.

---

## 🚀 Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the dashboard.

---

© 2026 iPark Project. All rights reserved.

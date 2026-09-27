---
name: erp-ui-design-system
description: >-
  Comprehensive blueprint, strict design system rules, anti-AI-slop standards, and component
  architecture for crafting world-class, high-density, professional ERP and manufacturing
  operational applications. Use this skill whenever designing, building, refactoring, or
  polishing UI/UX components, layouts, data tables, command palettes, workflow trackers, or
  state management for enterprise ERP systems.
---

# World-Class Enterprise ERP UI & Architecture System

A rigorous, battle-tested standard for creating elite, data-dense, razor-sharp enterprise operations software. Draws engineering and design rigor from **Linear**, **Odoo 18**, **Katana Cloud Manufacturing**, **SAP Fiori Horizon**, and **Mercury**.

---

## 1. The Anti-"AI Slop" Charter (Zero-Tolerance Rules)

AI-generated dashboards frequently fail enterprise standards by generating flashy, decorative nonsense. **Any design exhibiting the following traits is strictly prohibited:**

| AI Slop Anti-Pattern 🚫 | Enterprise Standard Replacement ✅ |
| :--- | :--- |
| **Purple / Violet Gradient Themes:** Random gradients, neon glows, violet cards, and futuristic sci-fi fluff. | **Restrained Obsidian / Zinc Neutrals:** Solid, sober, high-contrast surfaces (`#090a0f` / `#ffffff`) with deep cobalt blue (`#1d4ed8`) as the single primary accent. |
| **Giant Empty KPI Cards:** Massive 200px tall cards displaying a single number with 85% wasted whitespace. | **Dense Metric Ribbons:** Compact 72px–88px KPI tiles showing number, delta, comparison baseline, and direct click-to-filter drill-down. |
| **Bubble Radiuses (`rounded-2xl`, `rounded-3xl`):** Playful toy-like rounded corners on operational controls. | **Industrial Precision Radiuses:** Strict `4px` to `6px` for controls, inputs, and badges; `8px` max for panels. Clean, engineered lines. |
| **Heavy Muddy Drop-Shadows:** Diffuse floating shadows that make tables look disconnected and floaty. | **Razor-Sharp 1px Borders:** Sub-pixel borders (`border-zinc-200` in light, `border-white/10` in dark) with minimal `shadow-xs`. |
| **Fake Charts & Progress Rings:** Static SVG donuts or circular bars that provide no real data or filters. | **Actionable Tabular Data & Segmented Bars:** Clickable status chips, clear tabular summaries, and real stage distribution bars. |
| **Color Carnival:** Using 7 different pastel shades (pink, lavender, cyan, yellow, orange) for arbitrary badges. | **Semantic Signal Palette:** Colors represent *only* operational truth: **Green** (Done/Approved), **Amber** (Pending/Due Soon), **Red** (Blocked/Overdue), **Slate** (Draft/Neutral). |

---

## 2. Color Palette & Visual Tokens (Enterprise Restraint)

### Dark Mode (Default for Long-Shift Operators)
```css
--bg-app: #08090d;              /* Deep obsidian base */
--bg-panel: #0f1118;            /* Card & table surface */
--bg-subtle: #161822;           /* Hover states, active rows, input bg */
--border-subtle: rgba(255, 255, 255, 0.08); /* Crisp 1px division */
--border-hover: rgba(255, 255, 255, 0.18);
--text-primary: #f8fafc;        /* High-contrast headings & primary values */
--text-secondary: #94a3b8;      /* Labels, metadata, timestamps */
--text-muted: #64748b;          /* Placeholders, disabled states */
```

### Light Mode (High-Illumination Office Mode)
```css
--bg-app-light: #f8fafc;        /* Crisp cool slate base */
--bg-panel-light: #ffffff;      /* Pure white container */
--bg-subtle-light: #f1f5f9;     /* Row hover & control backgrounds */
--border-subtle-light: #e2e8f0; /* Crisp 1px division */
--border-hover-light: #cbd5e1;
--text-primary-light: #0f172a;  /* Deep ink text */
--text-secondary-light: #475569;/* Readable secondary body */
--text-muted-light: #94a3b8;
```

### Semantic Operational Signals (Strictly Functional)
- **Primary / Brand:** `#1d4ed8` (Cobalt Blue) — Focus rings, primary buttons, active navigation.
- **Success / Done:** `#16a34a` (Forest Green) — Approved, Dispatched, QC Passed. (Bg: `rgba(22, 163, 74, 0.1)`).
- **Warning / Action Needed:** `#d97706` (Amber Ochre) — Due soon, Pending Review, Feasibility Check. (Bg: `rgba(217, 119, 6, 0.1)`).
- **Critical / Blocked:** `#dc2626` (Crimson Red) — Overdue, Blocked, Feasibility Rejected. (Bg: `rgba(220, 38, 38, 0.1)`).
- **Neutral / Draft:** `#475569` (Slate) — Draft, Archived, Unassigned. (Bg: `rgba(71, 85, 105, 0.1)`).

---

## 3. Typography & Tabular Alignment

Operational scanning speed depends on typographic discipline:
1. **Interface Copy:** `font-sans` (`Inter` or `IBM Plex Sans`), weights `400` (regular), `500` (medium), `600` (semibold). Never use ultra-thin or ultra-heavy weights.
2. **Codes, Measurements & Numbers:** `font-mono` (`IBM Plex Mono` or `Geist Mono`) with `font-feature-settings: "tnum"`.
   - Request IDs: `SR-2026-081`
   - Quantities & GSM: `450 GSM`, `12,500 pcs`, `240 × 180 × 60 mm`
   - Dates & Durations: `25 Sep 2026`, `+3d overdue`
   - Currencies: `₹ 4,85,200.00`
3. **Type Scale:**
   - Page Title: `18px` (`text-lg`), semibold
   - Panel Headings: `14px` (`text-sm`), semibold
   - Table Body & Controls: `13px` (`text-[13px]`), regular/medium
   - Micro-badges & Metadata: `11px` (`text-xs`), uppercase tracking-wider

---

## 4. Master Layout Anatomy (World-Class ERP View)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│  [Logo] NAVNEET SAMP ERP   │  🔍 Search requests, SKUs, plants... (Ctrl+K)   │  [Live]  🔔  👤   │
├──────────────┬───────────────────────────────────────────────────────────────────────────────────┤
│ 📊 Overview  │  PROCESS STAGE CHEVRON RIBBON:                                                    │
│ 📋 Requests  │  [01 Intake (5)] ➔ [02 Feas (3)] ➔ [03 CAD (2)] ➔ [04 Cost (8)] ➔ [05 SAMP] ➔ ...│
│ 🎨 Creative  ├───────────────────────────────────────────────────────────────────────────────────┤
│ 📐 Studio    │  OPERATIONAL TOOLBAR:                                                             │
│ 🧪 SAMP Team │  [+ New Request]  [🔍 Status: Pending ×]  [Plant: Vasai ×]  [Density: ⊞]  [Export]│
│ 💰 Costing   ├──────────────────────────────────────────────────────┬────────────────────────────┤
│ 🏭 Plants    │  DENSE DATA TABLE (Sticky Header, 38px Rows)         │  MASTER-DETAIL INSPECTOR   │
│ 👥 Directory │  [x] SR-081 │ Corrugated Box │ 450 GSM │ ⚠️ Pending  │  SR-081 Technical Sheet    │
│ ⚙️ Settings  │  [ ] SR-082 │ Mono Carton    │ 300 GSM │ ✅ Approved │  • Customer: Flipkart      │
│              │  [ ] SR-083 │ Rigid Gift Box │ 800 GSM │ ⌛ CAD In-Pr│  • Plant: Unit 2 Vasai     │
│              │  [ ] SR-084 │ Blister Card   │ 350 GSM │ 💰 Costing  │  • Die-line: DL-992.dxf    │
│              │  [ ] SR-085 │ Paper Carry Bag│ 180 GSM │ 🚀 Dispatch │  • Action: [Approve Stage] │
└──────────────┴──────────────────────────────────────────────────────┴────────────────────────────┘
```

### Layout Elements:
1. **Top Process Stage Ribbon:** Visual breadcrumb showing requests distributed across the 6 workflow steps:
   `01 Intake  ➔  02 Feasibility  ➔  03 Creative/CAD  ➔  04 Costing  ➔  05 SAMP Run  ➔  06 Dispatch`
   *Clicking any stage immediately filters the table to that stage.*
2. **Master-Detail Split Pane:** Selecting a table row opens an inspector pane on the right (380px–460px) without losing your scroll position or pagination.
3. **Multi-View Modes:** Instantly toggle between **Dense Table View**, **Kanban Stage Board**, and **Production Calendar Timeline**.
4. **Command Palette (`Ctrl+K`):** Global instantaneous search for jump-to-order, switch module, or search team member.

---

## 5. Codebase Architecture: Maximum Reusability, Zero Duplication

All UI must follow a strict **3-Tier Separation** to prevent bloated, unmaintainable code:

```
frontend/src/
├── components/
│   ├── ui/                    # Tier 1: Core Primitives (Pure, unstyled logic or minimal Tailwind)
│   │   ├── Button.tsx         # variants: primary, secondary, danger, ghost, subtle
│   │   ├── Input.tsx          # text, search, number with mono alignment
│   │   ├── Badge.tsx          # size: xs, sm; tone: success, warning, danger, neutral
│   │   ├── Modal.tsx          # accessible dialog with ESC & backdrop lock
│   │   ├── Drawer.tsx         # right-sliding inspector pane
│   │   ├── Dropdown.tsx       # keyboard navigable menu
│   │   ├── Tabs.tsx           # underline or pill tabs
│   │   └── Tooltip.tsx
│   │
│   └── erp/                   # Tier 2: Shared ERP Compound Blocks (Used across EVERY page)
│       ├── DataTable/         # Generic virtualized/paginated data table
│       │   ├── DataTable.tsx
│       │   ├── DataTableHeader.tsx
│       │   └── DataTablePagination.tsx
│       ├── CommandPalette/    # Universal Ctrl+K launcher
│       ├── ProcessStepper/    # Visual stage tracker ribbon
│       ├── FilterToolbar/     # Tag-based faceted filter bar
│       ├── StatusPill/        # Standardized semantic status indicator
│       ├── MetricTile/        # High-density KPI summary tile
│       └── AuditChatter/      # Activity log & timestamped notes
│
├── features/                  # Tier 3: Domain Modules (ONLY schemas, hooks & view composition)
│   ├── dashboard/             # Executive operations control room
│   ├── sample-requests/       # Request intake, feasibility checks, specs
│   ├── creative/              # Artwork brief reviews & proofs
│   ├── studio/                # CAD die-lines & prepress verification
│   ├── costing/               # BOM, material cost calculators, margins
│   └── members/               # Plant routing & user access control
│
├── layouts/                   # AppShell, Sidebar, Header, Breadcrumbs
├── context/                   # AuthContext, ThemeContext
├── hooks/                     # useKeyboardShortcut, useTableFilter, useDebounce
├── lib/                       # api, formatters, storage, types
└── styles.css                 # Clean CSS tokens & utilities (no arbitrary hacky classes)
```

### The DRY (Don't Repeat Yourself) Rules:
- **No In-line Table Building:** Never write custom `<table>`, `<tr>`, `<td>` loops inside feature pages. Always supply typed `columns` and `data` to `<DataTable columns={cols} data={data} />`.
- **No In-line Status Badges:** Always use `<StatusPill status={row.status} />` with centralized mapping.
- **No Duplicate Modals:** Reusable confirmation dialogs (`<ConfirmModal />`) for destructive or stage-change actions.
- **Isolate Data Fetching:** Feature pages must use clean custom hooks (`useSampleRequests`, `usePlantCapacity`) rather than writing raw `fetch` and multiple `useState` calls in the component body.

---

## 6. Performance & Optimization Checklist

- [ ] **Bundle Size:** Code-split every major route using `React.lazy()` and `Suspense`.
- [ ] **Render Performance:** Memoize heavy filter/sort operations with `useMemo`. Memoize callbacks passed to tables with `useCallback`.
- [ ] **Keyboard First:** `Ctrl+K` for global search, `Esc` to close any drawer/modal, Arrow keys for table navigation.
- [ ] **Zero Layout Shifts (CLS):** Provide proper skeleton loaders matching table/panel dimensions during data fetches.
- [ ] **Touch & Responsiveness:** On mobile/tablet, collapse the sidebar into an off-canvas drawer and adapt the Master-Detail split into a full-screen drawer.

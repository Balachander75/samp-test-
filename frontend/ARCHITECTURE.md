# Frontend Architecture & Agent Quick-Reference Guide

> **For AI Agents & Developers:** Read this document first before inspecting or modifying code. This guide provides an immediate map of where each feature lives, how data flows across departments, and the rules for making modifications with minimal context overhead.

---

## 1. Directory Anatomy

```
frontend/src/
├── App.tsx                     # Top-level router, code splitting, route guards & auto-save listener
├── context/                    # Cross-cutting global state providers
│   ├── ThemeContext.tsx        # Dark / Light theme persistence
│   ├── BusinessYearContext.tsx # October–September business year (e.g. "2026-27")
│   └── PlantContext.tsx        # Active manufacturing plant selection ("1505", "1508", etc.)
├── layouts/                    # App chrome & layout navigation
│   ├── AppShell.tsx            # Topbar with quick refresh, search shortcut (Ctrl+K), plant switcher
│   ├── Sidebar.tsx             # Collapsible left navigation with live badge counts
│   └── navigation.ts           # Route definitions and navigation groupings
├── types/                      # Global & Master Data contracts
│   └── master.ts               # PlantItem, CustomerItem, BindingHierarchy, ProductSearchResult
├── features/                   # Self-contained domain modules (each has index.ts & types.ts)
│   ├── dashboard/              # OperationsOverview (telemetry, KPI ribbon, capacity)
│   ├── sample-requests/        # Marketing intake, staging, drafts, programs, and feasibility
│   │   ├── components/         # Modular drawers, wizards, and modals
│   │   ├── hooks/              # Custom hooks (e.g. useMasterData, useFeasibilityImageSources)
│   │   ├── overview/           # MarketingOverviewPage
│   │   ├── sampling/           # SamplingRequestsPage (Table + Packages)
│   │   ├── feasibility/        # FeasibilityRequestsPage
│   │   ├── programs/           # ProgramPlanningPage
│   │   └── types/              # SampleRequestItem, ProgramMaterialItem, StagedProductItem
│   ├── creative/               # Creative artwork briefs & Shutterstock submissions
│   │   ├── types.ts            # CreativeBriefItem, DesignRequest, CreativeDesignSubmission
│   │   ├── CreativeDesignPage.tsx
│   │   └── CreativeDesignOutputModal.tsx
│   ├── studio/                 # Structural CAD dielines & prepress specifications
│   │   ├── types.ts            # DielineItem
│   │   ├── StudioWorkDesk.tsx
│   │   └── StudioInspectorModal.tsx
│   ├── costing/                # BOM pricing, unit cost, interactive margin simulator
│   │   ├── types.ts            # CostingItem
│   │   ├── CostingTeamDesk.tsx
│   │   └── components/CostingInspectorModal.tsx
│   └── samp-team/              # Sampling Lab & Feasibility reviews
│       ├── SamplingTeamDesk.tsx
│       ├── feasibility/SampFeasibilityReviewPage.tsx
│       └── programs/SamplingProgramPlanningView.tsx
├── components/                 # Reusable UI & ERP widgets
│   ├── ui/                     # Primitives: Button, StatusPill, ErrorBoundary
│   └── erp/                    # ERP blocks: DataTable, MetricRibbon, ProcessStageRibbon, OperationalDatePicker
├── infrastructure/api/         # Centralized HTTP Client & REST Endpoints
│   ├── client.ts               # Standard apiFetch wrapper with Bearer token & error normalization
│   ├── sampleRequestsApi.ts    # Sample requests CRUD, batch create, batch status update, design briefs
│   ├── feasibilityApi.ts       # Feasibility requests, activity logs, verdicts
│   ├── masterApi.ts            # Cached product characteristics, classes, plants, customers
│   └── downstreamApi.ts        # Creative briefs, studio dielines, costing estimations
└── lib/                        # Pure utility functions
    ├── businessYear.ts         # Business year calculation (Oct 1 - Sep 30)
    ├── holidayUtils.ts         # Working days / SLA calculation
    ├── session.ts              # LocalStorage & SessionStorage auth helpers
    └── utils.ts                # Tailwind class merging (cn helper)
```

---

## 2. Departmental Workflow & Handoff Lifecycle

When navigating the workflow, requests progress through these screens:

```
[Marketing / Sales]
  1. Intake:          /sample-requests/product-staging
  2. Draft Queue:     /sample-requests/draft-workspace
           │
           ▼ (Release to Creative)
[Creative Studio]
  3. Artwork Briefs:  /creative-work/design
  4. Submit Output:   CreativeDesignOutputModal (Drive links + Shutterstock rows)
           │
           ▼ (Awaiting Marketing Review)
[Marketing Review]
  5. Sign-Off:        DesignRequestInspectorModal (Accept & Close OR Request Remaining)
           │
           ▼ (Release to CAD / Dielines)
[Studio CAD]
  6. Dieline Eng:     /studio-work (Board caliper, dieline construction, 3D simulation)
           │
           ▼
[Costing Desk]
  7. Pricing:         /costing-team (Substrate cost, margin calculator, quote release)
           │
           ▼
[Sampling Lab (SAMP)]
  8. Fabrication:     /samp-team-work (Technical feasibility verdict & physical prototypes)
           │
           ▼
[Dispatched / Won]
  9. Production:      Plant Execution / Deal closed
```

---

## 3. Fast Reference: "Where Do I Make Changes?"

| If you need to change... | Open this file directly: |
|---|---|
| **Add/edit a Marketing request field** | `features/sample-requests/types/index.ts` & `components/staging/` |
| **Modify the Staging flow / Add Product wizard** | `features/sample-requests/components/ProductStagingWorkspace.tsx` |
| **Modify Draft Package view or Bulk Release** | `features/sample-requests/components/DraftPackagesView.tsx` & `DraftWorkspacePage.tsx` |
| **Change Sampling table columns or filters** | `features/sample-requests/sampling/SamplingRequestsPage.tsx` |
| **Modify Creative output submission** | `features/creative/CreativeDesignOutputModal.tsx` |
| **Change Costing formulas or margin slider** | `features/costing/components/CostingInspectorModal.tsx` |
| **Change Feasibility review tabs or verdicts** | `features/sample-requests/components/FeasibilityInspectorModal.tsx` |
| **Add a new API endpoint** | `infrastructure/api/sampleRequestsApi.ts` (or appropriate API file) |
| **Change navigation routes or sidebar badges** | `layouts/navigation.ts` & `layouts/Sidebar.tsx` |
| **Global Theme / Plant / Business Year** | `context/ThemeContext.tsx`, `PlantContext.tsx`, `BusinessYearContext.tsx` |

---

## 4. Architectural Rules for Future Agent Edits

1. **Single Responsibility per File (<250-300 lines):**
   Do not add large modals, tabs, or forms directly into desk parent components. Create a sub-component under `components/` in the respective feature folder.
2. **Domain-Specific Types:**
   - Creative types $\rightarrow$ `features/creative/types.ts`
   - Studio types $\rightarrow$ `features/studio/types.ts`
   - Costing types $\rightarrow$ `features/costing/types.ts`
   - Master/Catalog types $\rightarrow$ `types/master.ts`
   - Re-export in `sample-requests/types/index.ts` only if cross-domain compatibility is strictly required.
3. **No Direct `fetch` Calls in Components:**
   Always use `apiFetch` in `infrastructure/api/`. Never write raw `fetch()` in React components.
4. **Public Barrel Exports:**
   Each feature exposes its public components and types via `features/<domain>/index.ts`. Always import from the feature root when consuming across domains.
5. **Always Verify Builds:**
   Run `npm run build` after editing to ensure TypeScript compiles with zero errors.

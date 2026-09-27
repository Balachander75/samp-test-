# Navneet SAMP Enterprise ERP - New UI Workspace

This directory is the dedicated workspace for the new, modern, world-class ERP UI.

### Architecture Guidelines
Follow the guidelines defined in [.agents/skills/erp-ui-design-system/SKILL.md](../.agents/skills/erp-ui-design-system/SKILL.md):
- **Tier 1:** `components/ui/` (Atomic primitives: Button, Input, Modal, Badge, Drawer)
- **Tier 2:** `components/erp/` (Shared ERP compound blocks: DataTable, CommandPalette, ProcessStepper, FilterBar, StatusPill)
- **Tier 3:** `features/` (Domain-specific workflows: dashboard, sample-requests, creative, studio, costing, members)
- **Layouts:** `layouts/` (Enterprise Shell, Header, Sidebar, Stage Breadcrumbs)

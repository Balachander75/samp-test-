# SAMP Operations UI Design Notes

## Direction

The interface is an operational workspace for reviewing requests and coordinating departmental handoffs. It uses compact controls, clear section labels, neutral surfaces, thin borders, and restrained semantic color so status and next actions remain easy to scan.

The dashboard uses a construction-grid treatment in its overview/workflow surface. Other department desks retain their own domain layouts while sharing the application shell and common visual tokens.

## Visual language in the current app

- Light mode uses cool slate and white surfaces; dark mode uses near-black and charcoal surfaces.
- Cobalt/blue is the primary action and navigation accent. Green, amber, red, and slate communicate operational status where used.
- Interface typography uses Geist/Inter system fallbacks; mono-styled values use Geist Mono/IBM Plex Mono fallbacks and tabular numerals.
- Controls and data surfaces use compact spacing, visible borders, and modest corner radii. The UI favors dense but readable operational views over oversized decorative cards.
- Existing Navneet brand assets are in `frontend/src/assets/` and `frontend/public/`.

## Application shell and interaction

The shared shell provides department navigation, a live clock, the October–September business-year display, theme toggle, refresh action on workspace routes, notification affordance, and user identity. `Ctrl+K` / `Cmd+K` focuses the request search when the active page exposes it and navigates to Marketing requests otherwise.

The responsive shell collapses navigation for narrow screens. Department workspaces use their own table, inspector, modal, and filtering patterns. Keyboard-operable controls, clear focus treatment, and loading/error feedback should be preserved when changing the UI.

## Dashboard

The Operations Overview presents operational metrics and request/workflow summaries with actions that lead into the relevant workspace. Its displayed counts are derived from the request data available to that view; do not imply that every department queue or metric is sourced from a dedicated production service.

## Implementation guidance

- Follow the component organization and detailed UI standards in [the ERP UI design skill](.agents/skills/erp-ui-design-system/SKILL.md).
- Reuse existing primitives in `frontend/src/components/ui/` and shared ERP blocks in `frontend/src/components/erp/` where they fit.
- Keep department-specific business rules in their feature modules and shared presentation behavior in reusable components.
- Preserve existing route behavior, request terminology, brand assets, and data contracts unless a task explicitly changes them.
- Treat this file as a summary of the current app. The skill guide is the broader design reference; where repository code differs, verify current behavior before describing it as implemented.

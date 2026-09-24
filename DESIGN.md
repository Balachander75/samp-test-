# Dashboard Design System

## Direction

The SAMP Operations dashboard uses an operational construction-grid language: the interface feels measured, legible, and ready for handoff. The grid is reserved for the dashboard hero and workflow surface, where it reinforces process structure.

## Visual grammar

- Base: paper-white and cool neutral surfaces with ink-black structure.
- Primary accent: cobalt blue for navigation, actions, and active workflow.
- Supporting signals: restrained orange for attention, green for completed/live states, violet only where an existing department meaning requires it.
- Typography: IBM Plex Sans for interface copy and IBM Plex Mono for request IDs, dates, and measurements.
- Geometry: 8px controls, 10–14px panels, thin neutral borders, soft offset elevation.
- Layout: compact shell, generous panel separation, dense but scannable tables, explicit section headings.

## Dashboard composition

The first viewport contains a grid-backed control-room introduction, a primary request action, a queue action, and four high-value operational metrics. The workflow panel then maps the four cross-team lanes as connected stages. Lower panels cover pipeline health, attention queue, demand concentration, recent requests, and team readiness.

## Interaction rules

- Metric and workflow tiles are actionable and preserve existing route behavior.
- Destructive and state-changing actions remain explicit in the existing drawers/modals.
- Hover states lift or clarify the target without relying on motion alone.
- Mobile collapses the shell into a compact single-column flow with preserved action priority.

## Scope

This document records the dashboard redesign only. Department workspaces inherit the same tokens and shell but retain their existing domain-specific surfaces until separately redesigned.

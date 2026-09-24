# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal teams at Navneet who manage a packaging and sampling workflow across marketing intake, creative design, studio/CAD, SAMP operations, costing, plant execution, and administration.

## Product Purpose

SAMP Operations provides one workspace for moving sample and design requests through departmental stages, reviewing feasibility, tracking work, managing members and plants, and coordinating operational handoffs.

## Operating Context

Users work from a shared dashboard and department-specific queues. Requests are searched, filtered, opened for specifications, updated through workflow stages, and sometimes exported. The interface must support dense operational scanning while remaining usable on smaller screens.

## Capabilities and Constraints

- React, TypeScript, Vite, React Router, and Tailwind are the existing application stack.
- Authentication and session state are represented in the client and backed by a mock API interceptor for this frontend project.
- The application includes protected routes for dashboard, sample requests, creative work, studio work, SAMP team work, costing, analytics, members, settings, help, and notifications.
- Existing Navneet and SAMP brand assets, workflow terminology, and request data behavior must remain intact.
- Accessibility, responsive behavior, loading states, error states, and keyboard-operable controls are required for production readiness.

## Brand Commitments

The product is branded as Navneet SAMP Operations. The existing Navneet logo and SAMP identifier are confirmed assets in `frontend-test/public` and `frontend-test/src/assets`.

## Evidence on Hand

The existing React implementation, route structure, mock data, request workflows, shared dashboard components, and logo/hero assets are the source of truth. No external product claims or customer proof should be invented.

## Product Principles

- Make the current operational state obvious at a glance.
- Keep department handoffs legible and actionable.
- Preserve dense data access without making the workspace feel noisy.
- Make every destructive or state-changing action explicit and recoverable.

## Open Decisions

- The definitive visual direction and long-term design-system ownership remain open.
- Backend integration and production authentication are outside this frontend redesign.

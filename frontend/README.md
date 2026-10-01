# Navneet SAMP Operations Frontend

This directory contains the React application for Navneet SAMP Operations. It provides the operations overview and department workspaces for Marketing/sample requests, seasonal program planning, product staging, Creative, Studio, Costing, and SAMP Team workflows.

The app is built with React 18, TypeScript, Vite, React Router, Tailwind CSS, and Lucide icons. It uses the FastAPI service in the sibling `backend/` directory for authentication and supported operational APIs. Some department work desks still contain local or static workflow data; check the feature/API implementation before assuming a screen is backed by persisted server data.

## Run the frontend

From this directory, install dependencies and start Vite:

```bash
npm install
npm run dev
```

Vite is configured to use port `5175`. The available scripts are:

- `npm run dev` — start the development server.
- `npm run build` — run the TypeScript project build and create the production bundle.
- `npm run preview` — serve the built bundle locally.

Set `VITE_API_URL` in the frontend environment when the API is hosted at a different origin. If it is omitted, API requests use the current origin. For local development, configure a Vite proxy if the backend is running separately; the current `vite.config.ts` does not define one.

## Run the backend

The backend lives in `../backend/`. Install its Python requirements, configure `DATABASE_URL` for a reachable PostgreSQL database, then run `python run.py` from the backend directory. The development defaults use port `8001` and database `navneet_samp` on localhost. Interactive API documentation is exposed at `/docs` while the service is running.

Authentication and the sample-request, product-characteristics, customer/plant master, feasibility, and program-request APIs are implemented in the backend. Review `backend/app/config.py` before using non-development settings; production startup requires a non-default JWT secret.

## Source layout

- `src/features/` — dashboard, auth, and department-specific workspaces.
- `src/components/ui/` — shared UI primitives and error handling.
- `src/components/erp/` — shared operational components such as tables, metrics, date selection, and customer selection.
- `src/layouts/` — application shell and navigation.
- `src/lib/` — API headers, session storage, business-year/date rules, and utilities.
- `src/context/` — shared theme state.
- `public/` and `src/assets/` — application brand images.

For product scope and current workflow caveats, see the repository-level [PRODUCT.md](../PRODUCT.md). For current UI direction, see [DESIGN.md](../DESIGN.md), and for detailed ERP component guidance see [the design-system skill](../.agents/skills/erp-ui-design-system/SKILL.md).

# Construction ERP — Frontend Wireframe

A clickable, frontend-only wireframe of a 19-application construction ERP for client pitching. There is no backend: all data is deterministic sample data held in the browser session.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/ (hash routing — host from any static server or folder)
npm run preview    # serve the build locally (works offline — use this for the pitch)
npm test           # menu-fidelity, config-integrity, status audit and route-crawl tests
```

Design-system gallery: `/#/gallery`. Pitch walkthrough: [docs/demo-script.md](docs/demo-script.md).

## Stack

React 19 + TypeScript + Vite · Tailwind CSS v4 (tokens from the sample wireframe; default palette disabled) · Radix UI primitives (dialog, dropdown, popover) · ECharts · Tabler Icons webfont · Zustand · Vitest.

## How it is built

The app is **config-driven**: each application is one file that declares its menus, entities and dashboard, and shared templates render every page.

```
src/
  theme/         index.css (Tailwind @theme tokens), status.ts (status → tone map)
  config/
    types.ts     the contract: AppConfig, EntityDef, FieldDef, ViewSpec, DashboardSpec
    dsl.ts       helpers: group / leaf / page, register / fieldView / statusView / lineItems / docs …
    masters.ts   shared masters: projects, clients, sites, vendors, employees, subcontractors, items, equipment
    apps/*.ts    one file per application (menus = exact client tree, entities, dashboard)
    registry.ts  app/entity lookup and route resolution
  mock/          seeded generator, in-session store (create/edit/archive/status), toasts, UI prefs
  components/    ui kit (sample-style), fields, DataTable, Chart, overlays, widgets
  templates/     one template per view type (register, wizard, line items, board, documents,
                 checklist, comparison, tree, gantt, calendar, timeline, approval, analysis,
                 statement, gallery, print, map, settings) + record detail / form + dashboards
  shell/         navy header, 9-dot switcher, search palette, sidebar, breadcrumbs, layout
  pages/         Enterprise Dashboard, app page router, component gallery
tests/           navTree.fixture.ts (exact client menu tree) + tests
```

### Adding or changing a page
Edit the app's file in `src/config/apps/`. The sidebar label is the source of truth; ids and routes are derived from it (`Planning & Control` → `/project/planning-and-control`). Then run `npm test`: the tree-fidelity test compares every app against `tests/navTree.fixture.ts`.

### Field-type child menus
Child menus that name a field (for example Project Master › Project Code, BOQ › Unit) use `fieldView(entity, field)`. It opens the parent register with that column highlighted and sorted, plus a summary strip for the field.

### Status colours
Status colours are semantic only: blue = active / in progress, green = completed / approved, yellow = pending / at risk, red = delayed / rejected, gray = draft / inactive. They are resolved centrally in `src/theme/status.ts`.

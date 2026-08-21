# org-graph

A small web application backed by a **graph database** (CognoDB), exploring an organisation's reporting structure alongside its supply chain. Built for the WEXA AI take-home assignment.

- **Use case:** Org chart + supply chain (people, departments, projects, products, suppliers, locations)
- **Stack:** TypeScript (strict) · Node.js · Express · React · Tailwind · shadcn/ui · @tanstack/react-query · axios · neo4j-driver
- **Database:** CognoDB (managed graph DB, openCypher over Bolt)

---

## 1. Use case

Most business data lives in rows and joins — but the interesting questions in an org-and-supply-chain context are about **connections**: *who ultimately reports to the CEO?*, *which projects depend on a supplier in region X?*, *how are two employees connected through their managers?*

A graph database answers these directly with variable-length path traversals, where a relational schema would force recursive CTEs or repeated self-joins.

This app lets a non-technical user explore that graph through:

- A **dashboard** with counts and a per-region supplier breakdown
- **People, Departments, Projects, Products, Suppliers, Locations** browse pages with list + detail views, full CRUD, and cross-links
- A **Graph Explorer** with three preset views (org chart, supply chain, full graph) — click any node to inspect its properties and jump to its detail page
- A **global search API** across all node labels (powering search across the app)

---

## 2. Why a graph database?

This use case fits a graph DB for three concrete reasons:

1. **Variable-length reporting chains.** "Find everyone who ultimately reports up to the CEO" is `MATCH (p:Person)-[:REPORTS_TO*]->(c:Person {title: "CEO"}) RETURN p` — one line. In SQL this is a recursive CTE that's brittle and hard to parameterise.
2. **Multi-domain joins without a schema rewrite.** Org + supply relationships cross-cut `people`, `products`, and `suppliers`. A graph lets new relationship types be added without altering a rigid table schema.
3. **Path-shaped questions.** "Shortest reporting path between two employees" is a first-class graph query — in SQL it's awkward self-joins over an `employees.manager_id` column.

---

## 3. Data model

```mermaid
graph LR
    Person([Person])
    Department([Department])
    Role([Role])
    Project([Project])
    Product([Product])
    Supplier([Supplier])
    Location([Location])

    Person -->|REPORTS_TO| Person
    Person -->|WORKS_IN| Department
    Person -->|HAS_ROLE| Role
    Person -->|MANAGES| Project

    Project -->|USES| Product
    Product -->|SUPPLIED_BY| Supplier

    Supplier -->|LOCATED_IN| Location
    Department -->|LOCATED_IN| Location
```

### Nodes

| Label | Properties |
|---|---|
| `Person` | `id`, `name`, `email`, `title`, `joinedAt` |
| `Department` | `id`, `name`, `costCenter` |
| `Role` | `id`, `level` (IC / Manager / Director / VP / C-level) |
| `Project` | `id`, `name`, `status` (planned / active / done) |
| `Product` | `id`, `sku`, `name`, `category` |
| `Supplier` | `id`, `name`, `rating` |
| `Location` | `id`, `city`, `country`, `region` |

### Relationships

- `(:Person)-[:REPORTS_TO]->(:Person)`
- `(:Person)-[:WORKS_IN]->(:Department)`
- `(:Person)-[:HAS_ROLE]->(:Role)`
- `(:Person)-[:MANAGES]->(:Project)`
- `(:Project)-[:USES]->(:Product)`
- `(:Product)-[:SUPPLIED_BY]->(:Supplier)`
- `(:Supplier)-[:LOCATED_IN]->(:Location)`
- `(:Department)-[:LOCATED_IN]->(:Location)`

---

## 4. Tech stack

**Backend** — Node.js · Express · TypeScript (strict + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) · `neo4j-driver` · Bolt 5.x · openCypher

**Frontend** — React (Vite) · TypeScript (strict + extras) · Tailwind CSS · hand-written shadcn/ui primitives · @tanstack/react-query · axios · react-router-dom

**Tooling** — pnpm workspaces · `tsx` for backend dev/runtime

---

## 5. Project structure

```
org-graph/
├── backend/                      # Express + neo4j-driver API
│   ├── src/
│   │   ├── server.ts             # Express bootstrap + route wiring
│   │   ├── db/driver.ts          # neo4j-driver singleton
│   │   ├── routes/               # one router per resource + health, search, dashboard, graph
│   │   └── lib/                  # pagination + request validation
│   ├── scripts/
│   │   ├── seed.ts               # wipes + loads seed data
│   │   ├── wipe.ts               # DETACH DELETE the whole graph
│   │   └── data.ts               # deterministic seed fixtures
│   ├── Dockerfile                # multi-stage: tsc build + prod node_modules
│   └── package.json
├── frontend/                     # React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # hand-written shadcn primitives
│   │   │   ├── common/           # DataTable, DataState, Pagination, SearchBar, ...
│   │   │   ├── forms/            # one dialog per entity (create / edit)
│   │   │   ├── graph/            # force-directed GraphCanvas
│   │   │   └── layout/           # AppLayout + Sidebar
│   │   ├── pages/                # 15 routed pages
│   │   ├── hooks/                # useGraph, useHealth
│   │   ├── lib/                  # list-state, detail-hooks, mutations, format, graph-colors
│   │   ├── api/client.ts         # axios instance
│   │   ├── App.tsx               # router + routes
│   │   └── main.tsx              # QueryClientProvider + bootstrap
│   ├── Dockerfile                # vite build -> nginx (serves SPA + proxies /api)
│   ├── nginx.conf                # SPA fallback + /api proxy to the backend
│   └── package.json
├── packages/
│   └── shared-types/             # API request/response types shared by both layers
├── README.md
├── docker-compose.yml            # one-command container deploy
├── .dockerignore                 # keeps secrets + node_modules out of images
├── pnpm-workspace.yaml
└── package.json                  # workspace root
```

---

## 6. Setup & run

### 6.1 Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** 9+ (`npm i -g pnpm`)
- A **CognoDB Cloud** account (free tier is enough)

### 6.2 Create the CognoDB instance

1. Sign up at <https://console.cognodb.com/signup>. Free tier, no credit card.
2. From the console, create a free instance and pick a region. Provisions in under a minute.
3. Save the connection URI of the form `bolt+s://<instance-id>.databases.cognodb.com` and the generated password for the user `cognodb`. The password is shown **exactly once** — copy it immediately.

### 6.3 Clone & install

```bash
git clone https://github.com/azharnazli/org-graph-cognoDB.git
cd org-graph-cognoDB
pnpm install
```

### 6.4 Configure environment variables

Copy the templates and fill in real values. **Never commit `backend/.env`** — it's in `.gitignore`.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

```bash
COGNODB_URI=bolt+s://<instance-id>.databases.cognodb.com
COGNODB_USER=cognodb
COGNODB_PASSWORD=<your-saved-password>
PORT=3000
```

### 6.5 Load seed data

```bash
pnpm seed
```

This wipes any existing data and loads: 1 CEO + 2 VPs + 5 Directors + 10 Managers + 32 ICs (50 people), 10 departments, 30 projects, 40 products, 20 suppliers, 15 locations, plus all 8 relationship types. The seed is deterministic — re-running produces the same graph.

To wipe without reseeding: `pnpm wipe`.

### 6.6 Start dev servers

```bash
pnpm dev
```

This starts the backend (port 3000) and the frontend Vite dev server (port 5173, proxies `/api` to the backend) in parallel. Open <http://localhost:5173>.

To run them separately:

```bash
pnpm --filter @org-graph/backend dev
pnpm --filter @org-graph/frontend dev
```

### 6.7 Run with Docker (optional)

The app ships as two containers: the Express backend and an nginx container that serves the built frontend and proxies `/api` to the backend. CognoDB stays external — no database container needed.

**Prerequisites:** Docker with the Compose plugin.

1. Create `backend/.env` as in **6.4** (compose injects it into the backend container at runtime).
2. Build and start:

   ```bash
   docker compose up --build
   ```

3. Open <http://localhost:8080>. The API is also reachable directly at <http://localhost:3000>.
4. Stop with `docker compose down`. Add `-d` to run detached: `docker compose up -d --build`.

To deploy to a server, set `CORS_ORIGIN` in `docker-compose.yml` to the frontend's public origin and point `nginx.conf`'s `proxy_pass` at the backend service (it already is, by service name).

---

## 7. API

All endpoints live under `/api`. Every resource exposes full CRUD. List endpoints accept `page`, `pageSize`, and per-resource `sort` + `order` query params (whitelisted fields, never interpolated into Cypher). All Cypher uses parameterised queries.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | DB connection status + node count |
| GET | `/api/dashboard` | Aggregate counts + suppliers per region |
| GET | `/api/search?q=<term>` | Global cross-label search (min 2 chars) |
| GET / POST | `/api/people` | List + create |
| GET / PUT / DELETE | `/api/people/:id` | Detail + update + delete |
| GET | `/api/people/:id/reports-chain?to=<id>` | Shortest path via `REPORTS_TO` (multi-hop) |
| GET / POST | `/api/departments` | List + create |
| GET / PUT / DELETE | `/api/departments/:id` | Detail + update + delete |
| GET / POST | `/api/projects` | List + create; `?status=planned\|active\|done` |
| GET / PUT / DELETE | `/api/projects/:id` | Detail + update + delete |
| GET | `/api/projects/:id/managers` | Manager ids for a project |
| GET / POST | `/api/products` | List + create |
| GET / PUT / DELETE | `/api/products/:id` | Detail + update + delete |
| GET / POST | `/api/suppliers` | List + create |
| GET / PUT / DELETE | `/api/suppliers/:id` | Detail + update + delete |
| GET / POST | `/api/locations` | List + create |
| GET / PUT / DELETE | `/api/locations/:id` | Detail + update + delete |
| GET | `/api/roles` | List the 5 role levels |
| GET | `/api/graph?view=org\|supply\|all` | Nodes + links for a graph view |
| GET | `/api/graph?view=neighborhood&node=<id>&depth=<n>` | Neighborhood around one node (depth 1–4) |

---

## 8. UI pages

| Path | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Aggregate counts + suppliers per region |
| `/people` · `/people/:id` | People | Searchable list + CRUD; detail with profile, manager, direct reports, projects, and a "find reports chain" multi-hop picker |
| `/departments` · `/departments/:id` | Departments | People + projects per dept, with location |
| `/projects` · `/projects/:id` | Projects | Status filter; detail with managers, dept, products |
| `/products` · `/products/:id` | Products | Suppliers + projects |
| `/suppliers` · `/suppliers/:id` | Suppliers | Products + location |
| `/locations` · `/locations/:id` | Locations | List + detail |
| `/explorer` | Graph Explorer | Org chart, supply chain, or full-graph view; click a node to inspect properties and open its page |
| any other path | 404 | Catch-all |

Detail pages render a **neighborhood graph** around the current entity. UI uses hand-written shadcn/ui primitives with explicit **loading** (Skeleton), **empty** (DataState), and **error** (Alert) states. The app header shows a live DB connection indicator that polls `/api/health` every 10 seconds.

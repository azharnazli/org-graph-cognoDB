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

- A **dashboard** with counts and recent activity
- **People, Departments, Projects, Products, Suppliers, Locations** browse pages with list + detail views
- A **Graph Explorer** that runs read-only Cypher queries and renders the result as a visual graph
- **Global search** across all node labels

> Replace the screenshot blocks below with real screenshots before final submission.

### Screenshots

| Dashboard | Person detail | Graph Explorer |
|---|---|---|
| _TODO: dashboard.png_ | _TODO: person-detail.png_ | _TODO: graph-explorer.png_ |

---

## 2. Why a graph database?

This use case fits a graph DB for three concrete reasons:

1. **Variable-length reporting chains.** "Find everyone who ultimately reports up to the CEO" is `MATCH (p:Person)-[:REPORTS_TO*]->(c:Person {title: "CEO"}) RETURN p` — one line. In SQL this is a recursive CTE that's brittle and hard to parameterise.
2. **Multi-domain joins without a schema rewrite.** Org + supply relationships cross-cut `people`, `products`, and `suppliers`. A graph lets new relationship types (e.g. `AUDITED_BY`) be added without altering a rigid table schema.
3. **Path-shaped questions.** "Shortest reporting path between two employees" or "common managers of two people" are first-class graph queries — in SQL they're awkward self-joins over an `employees.manager_id` column.

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
| `Person` | `id`, `name`, `email`, `title`, `joined_at` |
| `Department` | `id`, `name`, `cost_center` |
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

**Backend** — Node.js · Express · TypeScript (strict) · `neo4j-driver` · Bolt 5.0–5.4 · openCypher
**Frontend** — React (Vite) · TypeScript (strict) · Tailwind CSS · shadcn/ui · @tanstack/react-query · axios

**Tooling** — pnpm workspaces · ESLint · Prettier · @typescript-eslint

---

## 5. Project structure

```
org-graph/
├── backend/                      # Express + neo4j-driver API
│   ├── src/
│   │   ├── server.ts
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── db/driver.ts
│   │   ├── queries/              # parameterized Cypher strings
│   │   └── middleware/
│   ├── scripts/seed.ts           # loads seed data into CognoDB
│   ├── tsconfig.json
│   └── package.json
├── frontend/                     # React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   └── ...
│   │   ├── pages/
│   │   ├── api/                  # axios clients per resource
│   │   ├── hooks/                # react-query hooks
│   │   ├── types/
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tsconfig.json
│   └── package.json
├── packages/
│   └── shared-types/             # API request/response types shared by both layers
├── README.md
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
2. From the console, create a free **c0** instance and pick a region. Provisions in under a minute.
3. Save the connection URI of the form `bolt+s://<instance-id>.databases.cognodb.cloud` and the generated password for the user `cognodb`. The password is shown **exactly once** — copy it immediately.

### 6.3 Clone & install

```bash
git clone https://github.com/<your-username>/org-graph.git
cd org-graph
pnpm install
```

### 6.4 Configure environment variables

Create the env files (templates below). Never commit real credentials.

**`backend/.env`**
```bash
COGNODB_URI=bolt+s://<instance-id>.databases.cognodb.cloud
COGNODB_USER=cognodb
COGNODB_PASSWORD=<your-saved-password>
PORT=3000
```

**`frontend/.env`**
```bash
VITE_API_BASE_URL=http://localhost:3000
```

### 6.5 Load seed data

```bash
pnpm --filter backend seed
```

This populates the graph with realistic synthetic data: ~50 people, 10 departments, 30 projects, 40 products, 20 suppliers, 15 locations — sized to fit the free-tier RAM ceiling.

### 6.6 Start dev servers

In two terminals:

```bash
# Terminal 1 — backend (http://localhost:3000)
pnpm --filter backend dev

# Terminal 2 — frontend (http://localhost:5173, Vite proxies /api to backend)
pnpm --filter frontend dev
```

Open <http://localhost:5173>.

---

## 7. Main queries

All queries are **parameterised** through the Neo4j driver — no string-concatenated Cypher.

### Q1 — Shortest reporting path between two people

```cypher
MATCH path = shortestPath(
  (a:Person {id: $fromId})-[:REPORTS_TO*]-(b:Person {id: $toId})
)
RETURN [n IN nodes(path) | n.name] AS chain, length(path) AS hops
```

*Why interesting:* `shortestPath` with variable-length patterns — the equivalent in SQL is a recursive CTE with cycle detection.

### Q2 — All employees who ultimately report up to a person

```cypher
MATCH (p:Person)-[:REPORTS_TO*]->(boss:Person {id: $bossId})
RETURN DISTINCT p.name, p.title
ORDER BY p.name
```

*Why interesting:* Multi-hop traversal (≥2 hops), unbounded depth.

### Q3 — Projects that depend on suppliers in a region

```cypher
MATCH (proj:Project)-[:USES]->(p:Product)-[:SUPPLIED_BY]->(s:Supplier)-[:LOCATED_IN]->(l:Location)
WHERE l.region = $region
RETURN DISTINCT proj.name, proj.status
```

*Why interesting:* 3-hop traversal across org and supply domains.

### Q4 — Common managers between two employees

```cypher
MATCH (a:Person {id: $aId})-[:REPORTS_TO*]->(m:Person),
      (b:Person {id: $bId})-[:REPORTS_TO*]->(m)
RETURN DISTINCT m.name, m.title
```

*Why interesting:* Path intersection — awkward in SQL, native in Cypher.

### Q5 — Departments with no supplier redundancy for a critical product

```cypher
MATCH (d:Department)<-[:WORKS_IN]-(p:Person)-[:MANAGES]->(proj:Project)-[:USES]->(prod:Product)
WHERE prod.category = 'critical'
WITH prod, collect(DISTINCT prod) AS products
MATCH (prod)-[:SUPPLIED_BY]->(s:Supplier)
WITH prod, count(s) AS supplierCount
WHERE supplierCount < 2
RETURN prod.name, supplierCount
```

*Why interesting:* Pattern + aggregation in one pass.

---

## 8. UI pages

| Path | Page | Purpose |
|---|---|---|
| `/` | Dashboard | Counts, entry points |
| `/people` | People list | Browse, search, sort |
| `/people/:id` | Person detail | Reporting chain, projects, dept |
| `/departments` · `/departments/:id` | Departments | People + projects per dept |
| `/projects` · `/projects/:id` | Projects | People + products used |
| `/products` · `/products/:id` | Products | Suppliers + projects |
| `/suppliers` · `/suppliers/:id` | Suppliers | Products + locations |
| `/explorer` | Graph Explorer | Read-only Cypher runner, graph view of results |
| `/search` | Global search | Cross-label search |

UI uses shadcn/ui for components, with explicit **loading** (`Skeleton`), **empty** (`Empty`), and **error** (`Alert`) states.

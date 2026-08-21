// Deterministic data generators for the org-graph seed.
// No external deps — just hand-written arrays + a tiny seeded PRNG.

// ---------- Roles ----------
export const ROLES = [
  { id: "role-ic", level: "IC" },
  { id: "role-mgr", level: "Manager" },
  { id: "role-dir", level: "Director" },
  { id: "role-vp", level: "VP" },
  { id: "role-c", level: "C-level" },
] as const;

// ---------- Departments ----------
export const DEPARTMENTS = [
  { id: "dept-eng", name: "Engineering", costCenter: "CC-1000" },
  { id: "dept-prod", name: "Product", costCenter: "CC-2000" },
  { id: "dept-design", name: "Design", costCenter: "CC-3000" },
  { id: "dept-mkt", name: "Marketing", costCenter: "CC-4000" },
  { id: "dept-sales", name: "Sales", costCenter: "CC-5000" },
  { id: "dept-hr", name: "People & HR", costCenter: "CC-6000" },
  { id: "dept-fin", name: "Finance", costCenter: "CC-7000" },
  { id: "dept-ops", name: "Operations", costCenter: "CC-8000" },
  { id: "dept-legal", name: "Legal", costCenter: "CC-9000" },
  { id: "dept-cs", name: "Customer Success", costCenter: "CC-1100" },
] as const;

// ---------- Locations ----------
export const LOCATIONS = [
  { id: "loc-sf", city: "San Francisco", country: "USA", region: "Americas" },
  { id: "loc-ny", city: "New York", country: "USA", region: "Americas" },
  { id: "loc-tor", city: "Toronto", country: "Canada", region: "Americas" },
  { id: "loc-mex", city: "Mexico City", country: "Mexico", region: "Americas" },
  { id: "loc-sao", city: "São Paulo", country: "Brazil", region: "Americas" },
  { id: "loc-lon", city: "London", country: "UK", region: "EMEA" },
  { id: "loc-par", city: "Paris", country: "France", region: "EMEA" },
  { id: "loc-ber", city: "Berlin", country: "Germany", region: "EMEA" },
  { id: "loc-ams", city: "Amsterdam", country: "Netherlands", region: "EMEA" },
  { id: "loc-war", city: "Warsaw", country: "Poland", region: "EMEA" },
  { id: "loc-tel", city: "Tel Aviv", country: "Israel", region: "EMEA" },
  { id: "loc-sin", city: "Singapore", country: "Singapore", region: "APAC" },
  { id: "loc-tok", city: "Tokyo", country: "Japan", region: "APAC" },
  { id: "loc-syd", city: "Sydney", country: "Australia", region: "APAC" },
  { id: "loc-bang", city: "Bangalore", country: "India", region: "APAC" },
] as const;

// ---------- Suppliers ----------
export const SUPPLIERS = [
  { id: "sup-1", name: "Acme Hardware", rating: 4.5 },
  { id: "sup-2", name: "Globex Cloud", rating: 4.8 },
  { id: "sup-3", name: "Initech Logistics", rating: 3.9 },
  { id: "sup-4", name: "Umbrella Print", rating: 4.1 },
  { id: "sup-5", name: "Stark Materials", rating: 4.7 },
  { id: "sup-6", name: "Wayne Catering", rating: 4.3 },
  { id: "sup-7", name: "Tyrell Robotics", rating: 4.9 },
  { id: "sup-8", name: "Cyberdyne Software", rating: 3.8 },
  { id: "sup-9", name: "Soylent Foods", rating: 4.0 },
  { id: "sup-10", name: "Massive Dynamic", rating: 4.6 },
  { id: "sup-11", name: "Hooli Search", rating: 4.2 },
  { id: "sup-12", name: "Pied Piper", rating: 4.8 },
  { id: "sup-13", name: "Vandelay Imports", rating: 3.7 },
  { id: "sup-14", name: "Sterling Cooper", rating: 4.4 },
  { id: "sup-15", name: "Wonka Industries", rating: 4.6 },
  { id: "sup-16", name: "Aperture Science", rating: 4.7 },
  { id: "sup-17", name: "Black Mesa", rating: 4.0 },
  { id: "sup-18", name: "Oscorp Genetics", rating: 3.9 },
  { id: "sup-19", name: "LexCorp Energy", rating: 4.5 },
  { id: "sup-20", name: "Daily Planet Press", rating: 4.1 },
] as const;

// ---------- Products ----------
export const PRODUCTS = [
  { id: "prod-1", sku: "HW-001", name: "Laptop Pro 14", category: "hardware" },
  { id: "prod-2", sku: "HW-002", name: "Standing Desk", category: "hardware" },
  { id: "prod-3", sku: "HW-003", name: "Monitor 27in", category: "hardware" },
  { id: "prod-4", sku: "HW-004", name: "Webcam 4K", category: "hardware" },
  { id: "prod-5", sku: "HW-005", name: "Mechanical Keyboard", category: "hardware" },
  { id: "prod-6", sku: "HW-006", name: "Server Rack 42U", category: "hardware" },
  { id: "prod-7", sku: "HW-007", name: "Network Switch", category: "hardware" },
  { id: "prod-8", sku: "HW-008", name: "Printer Color", category: "hardware" },
  { id: "prod-9", sku: "SW-001", name: "IDE License", category: "software" },
  { id: "prod-10", sku: "SW-002", name: "CI/CD Minutes", category: "software" },
  { id: "prod-11", sku: "SW-003", name: "Monitoring Tier", category: "software" },
  { id: "prod-12", sku: "SW-004", name: "CRM Seats", category: "software" },
  { id: "prod-13", sku: "SW-005", name: "Analytics Suite", category: "software" },
  { id: "prod-14", sku: "SW-006", name: "Design Tool Pro", category: "software" },
  { id: "prod-15", sku: "SW-007", name: "Email Marketing", category: "software" },
  { id: "prod-16", sku: "SW-008", name: "HRIS Module", category: "software" },
  { id: "prod-17", sku: "SW-009", name: "ERP Add-on", category: "software" },
  { id: "prod-18", sku: "SW-010", name: "Security Audit", category: "software" },
  { id: "prod-19", sku: "SV-001", name: "Catering Daily", category: "service" },
  { id: "prod-20", sku: "SV-002", name: "Cleaning Contract", category: "service" },
  { id: "prod-21", sku: "SV-003", name: "Translation Service", category: "service" },
  { id: "prod-22", sku: "SV-004", name: "Legal Retainer", category: "service" },
  { id: "prod-23", sku: "SV-005", name: "Recruiting Fee", category: "service" },
  { id: "prod-24", sku: "SV-006", name: "Audit Service", category: "service" },
  { id: "prod-25", sku: "SV-007", name: "Logistics Freight", category: "service" },
  { id: "prod-26", sku: "SV-008", name: "Courier Express", category: "service" },
  { id: "prod-27", sku: "OF-001", name: "Notebooks Pack", category: "office" },
  { id: "prod-28", sku: "OF-002", name: "Pens Box", category: "office" },
  { id: "prod-29", sku: "OF-003", name: "Whiteboard", category: "office" },
  { id: "prod-30", sku: "OF-004", name: "Coffee Beans 5kg", category: "office" },
  { id: "prod-31", sku: "OF-005", name: "Tea Selection", category: "office" },
  { id: "prod-32", sku: "OF-006", name: "Snack Box", category: "office" },
  { id: "prod-33", sku: "HW-009", name: "Tablet 11in", category: "hardware" },
  { id: "prod-34", sku: "HW-010", name: "Headphones ANC", category: "hardware" },
  { id: "prod-35", sku: "HW-011", name: "Docking Station", category: "hardware" },
  { id: "prod-36", sku: "HW-012", name: "External SSD 2TB", category: "hardware" },
  { id: "prod-37", sku: "SW-011", name: "Support Tier Gold", category: "software" },
  { id: "prod-38", sku: "SW-012", name: "E-commerce Plugin", category: "software" },
  { id: "prod-39", sku: "SV-009", name: "Photography", category: "service" },
  { id: "prod-40", sku: "SV-010", name: "Event Catering", category: "service" },
] as const;

// ---------- Projects ----------
export const PROJECTS = [
  { id: "proj-1", name: "Mobile App v3", status: "active" },
  { id: "proj-2", name: "Data Lake Migration", status: "active" },
  { id: "proj-3", name: "Customer Portal", status: "active" },
  { id: "proj-4", name: "Internal Wiki", status: "planned" },
  { id: "proj-5", name: "Q4 Marketing Site Refresh", status: "active" },
  { id: "proj-6", name: "Brand Identity Refresh", status: "planned" },
  { id: "proj-7", name: "Salesforce Integration", status: "active" },
  { id: "proj-8", name: "Pricing Experiment A/B", status: "active" },
  { id: "proj-9", name: "Office Network Upgrade", status: "planned" },
  { id: "proj-10", name: "SOC2 Compliance", status: "active" },
  { id: "proj-11", name: "Hire 20 Engineers", status: "active" },
  { id: "proj-12", name: "EU Expansion", status: "planned" },
  { id: "proj-13", name: "Mobile App v2 Sunset", status: "done" },
  { id: "proj-14", name: "Legacy CRM Migration", status: "done" },
  { id: "proj-15", name: "Annual Conference 2025", status: "done" },
  { id: "proj-16", name: "Brand Photo Shoot", status: "active" },
  { id: "proj-17", name: "Office Move London", status: "planned" },
  { id: "proj-18", name: "Self-serve Onboarding", status: "active" },
  { id: "proj-19", name: "Internal Analytics Dashboard", status: "active" },
  { id: "proj-20", name: "Vendor Consolidation", status: "active" },
  { id: "proj-21", name: "Carbon Neutral Pledge", status: "planned" },
  { id: "proj-22", name: "Open Source Contributions", status: "active" },
  { id: "proj-23", name: "Q1 Sales Kickoff", status: "done" },
  { id: "proj-24", name: "Multi-region Failover", status: "active" },
  { id: "proj-25", name: "Search Relevance v2", status: "active" },
  { id: "proj-26", name: "Customer NPS Survey", status: "active" },
  { id: "proj-27", name: "Office Snack Program", status: "active" },
  { id: "proj-28", name: "Vendor Risk Audit", status: "planned" },
  { id: "proj-29", name: "Q3 Marketing Campaign", status: "done" },
  { id: "proj-30", name: "Compliance Training", status: "active" },
] as const;

// ---------- Seeded PRNG (mulberry32) ----------
function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  "Alice", "Bob", "Carol", "Dan", "Eve", "Frank", "Grace", "Hank",
  "Iris", "Jack", "Kate", "Liam", "Mia", "Noah", "Olivia", "Pete",
  "Quinn", "Rita", "Sam", "Tara", "Uma", "Victor", "Wendy", "Xander",
  "Yara", "Zoe", "Aaron", "Beth", "Carl", "Dora",
];
const LAST = [
  "Smith", "Johnson", "Lee", "Garcia", "Patel", "Kim", "Brown",
  "Davis", "Miller", "Wilson", "Anderson", "Thomas", "Martinez",
  "Chen", "Wang", "Khan", "Singh", "Nguyen", "Cohen", "Kowalski",
];

// Title by role level
const TITLE_BY_LEVEL: Record<string, string[]> = {
  "C-level": ["Chief Executive Officer", "Chief Technology Officer"],
  VP: ["VP Engineering", "VP Product", "VP Sales", "VP Marketing", "VP Operations"],
  Director: ["Director, Engineering", "Director, Product", "Director, Design", "Director, Marketing", "Director, Sales", "Director, HR", "Director, Finance", "Director, Operations", "Director, Legal", "Director, Customer Success"],
  Manager: ["Engineering Manager", "Product Manager", "Design Manager", "Marketing Manager", "Sales Manager", "HR Manager", "Finance Manager", "Operations Manager", "Legal Manager", "Customer Success Manager"],
  IC: ["Software Engineer", "Senior Software Engineer", "Product Designer", "Marketing Specialist", "Account Executive", "Recruiter", "Financial Analyst", "Operations Analyst", "Legal Counsel", "Customer Success Specialist", "Data Analyst", "QA Engineer"],
};

export interface SeedPerson {
  id: string;
  name: string;
  email: string;
  title: string;
  joinedAt: string;
  roleId: string;
  deptId: string;
  reportsToId: string | null;
}

// 50 people in a 5-level org: 1 CEO + 2 VPs + 5 Directors + 10 Managers + 32 ICs.
export function generatePeople(): SeedPerson[] {
  const rng = mulberry32(42);
  const people: SeedPerson[] = [];
  let idx = 1;

  const pick = <T>(arr: readonly T[]): T => {
    if (arr.length === 0) throw new Error("pick() on empty array");
    return arr[Math.floor(rng() * arr.length)] as T;
  };
  const pickTitle = (titles: readonly string[]): string =>
    pick(titles) ?? titles[0] ?? "Unknown";
  const pickDept = (): string => {
    const idx = Math.floor(rng() * DEPARTMENTS.length);
    return (DEPARTMENTS[idx] ?? DEPARTMENTS[0]!).id;
  };
  const isoDate = (yearsAgo: number): string => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - yearsAgo);
    return d.toISOString().slice(0, 10);
  };

  const make = (
    roleId: string,
    title: string,
    reportsToId: string | null,
    yearsAgo: number,
  ): SeedPerson => {
    const first = pick(FIRST);
    const last = pick(LAST);
    const id = `p-${String(idx++).padStart(3, "0")}`;
    return {
      id,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@org-graph.example`,
      title,
      joinedAt: isoDate(yearsAgo),
      roleId,
      deptId: pickDept(),
      reportsToId,
    };
  };

  // 1 CEO
  const ceo = make("role-c", "Chief Executive Officer", null, 8);
  people.push(ceo);

  // 2 VPs reporting to CEO
  const vps: SeedPerson[] = [];
  for (let i = 0; i < 2; i++) {
    const t = pickTitle(TITLE_BY_LEVEL["VP"] ?? []);
    const vp = make("role-vp", t, ceo.id, 6);
    vps.push(vp);
    people.push(vp);
  }

  // 5 Directors reporting to VPs (distribute round-robin)
  const directors: SeedPerson[] = [];
  for (let i = 0; i < 5; i++) {
    const vp = vps[i % vps.length] ?? vps[0]!;
    const t = pickTitle(TITLE_BY_LEVEL["Director"] ?? []);
    const d = make("role-dir", t, vp.id, 5);
    directors.push(d);
    people.push(d);
  }

  // 10 Managers reporting to Directors
  const managers: SeedPerson[] = [];
  for (let i = 0; i < 10; i++) {
    const dir = directors[i % directors.length] ?? directors[0]!;
    const t = pickTitle(TITLE_BY_LEVEL["Manager"] ?? []);
    const m = make("role-mgr", t, dir.id, 3);
    managers.push(m);
    people.push(m);
  }

  // 32 ICs reporting to Managers
  for (let i = 0; i < 32; i++) {
    const mgr = managers[i % managers.length] ?? managers[0]!;
    const t = pickTitle(TITLE_BY_LEVEL["IC"] ?? []);
    people.push(make("role-ic", t, mgr.id, Math.floor(rng() * 3)));
  }

  return people;
}

// ---------- Project → Products (which products each project uses) ----------
export interface ProjectProduct {
  projectId: string;
  productId: string;
}

export function generateProjectProducts(): ProjectProduct[] {
  const rng = mulberry32(99);
  const pairs = new Set<string>();
  const out: ProjectProduct[] = [];
  for (const proj of PROJECTS) {
    const count = 2 + Math.floor(rng() * 4); // 2–5 products per project
    for (let i = 0; i < count; i++) {
      const product = PRODUCTS[Math.floor(rng() * PRODUCTS.length)] ?? PRODUCTS[0]!;
      const key = `${proj.id}|${product.id}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      out.push({ projectId: proj.id, productId: product.id });
    }
  }
  return out;
}

// ---------- Product → Suppliers (which suppliers supply each product) ----------
export interface ProductSupplier {
  productId: string;
  supplierId: string;
}

export function generateProductSuppliers(): ProductSupplier[] {
  const rng = mulberry32(7);
  const pairs = new Set<string>();
  const out: ProductSupplier[] = [];
  for (const prod of PRODUCTS) {
    const count = 1 + Math.floor(rng() * 3); // 1–3 suppliers per product
    for (let i = 0; i < count; i++) {
      const sup = SUPPLIERS[Math.floor(rng() * SUPPLIERS.length)] ?? SUPPLIERS[0]!;
      const key = `${prod.id}|${sup.id}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      out.push({ productId: prod.id, supplierId: sup.id });
    }
  }
  return out;
}

// ---------- Supplier → Location ----------
export function generateSupplierLocations(): Array<{ supplierId: string; locationId: string }> {
  const rng = mulberry32(11);
  return SUPPLIERS.map((sup) => {
    const loc = LOCATIONS[Math.floor(rng() * LOCATIONS.length)] ?? LOCATIONS[0]!;
    return { supplierId: sup.id, locationId: loc.id };
  });
}

// ---------- Department → Location ----------
export function generateDepartmentLocations(): Array<{ deptId: string; locationId: string }> {
  const rng = mulberry32(13);
  return DEPARTMENTS.map((d) => {
    const loc = LOCATIONS[Math.floor(rng() * LOCATIONS.length)] ?? LOCATIONS[0]!;
    return { deptId: d.id, locationId: loc.id };
  });
}

// ---------- Project → Managers (which people manage each project) ----------
export function generateProjectManagers(
  people: SeedPerson[],
): Array<{ projectId: string; personId: string }> {
  const rng = mulberry32(31);
  // Only Managers/Directors/VPs can manage projects
  const eligible = people.filter((p) => p.roleId !== "role-ic");
  const pairs = new Set<string>();
  const out: Array<{ projectId: string; personId: string }> = [];
  for (const proj of PROJECTS) {
    const count = 1 + Math.floor(rng() * 2); // 1–2 managers per project
    for (let i = 0; i < count; i++) {
      const mgr = eligible[Math.floor(rng() * eligible.length)] ?? eligible[0]!;
      const key = `${proj.id}|${mgr.id}`;
      if (pairs.has(key)) continue;
      pairs.add(key);
      out.push({ projectId: proj.id, personId: mgr.id });
    }
  }
  return out;
}

import { driver, verifyConnection, closeDriver } from "../src/db/driver.js";
import {
  ROLES,
  DEPARTMENTS,
  LOCATIONS,
  SUPPLIERS,
  PRODUCTS,
  PROJECTS,
  generatePeople,
  generateProjectProducts,
  generateProductSuppliers,
  generateSupplierLocations,
  generateDepartmentLocations,
  generateProjectManagers,
} from "./data.js";

async function main(): Promise<void> {
  await verifyConnection();
  const session = driver.session({ database: "neo4j" });

  try {
    console.log("[seed] Wiping existing data...");
    await session.run("MATCH (n) DETACH DELETE n");

    // ----- Roles -----
    console.log(`[seed] Roles (${ROLES.length})...`);
    await session.run(
      `UNWIND $rows AS row
       CREATE (r:Role {id: row.id, level: row.level})`,
      { rows: ROLES },
    );

    // ----- Departments -----
    console.log(`[seed] Departments (${DEPARTMENTS.length})...`);
    await session.run(
      `UNWIND $rows AS row
       CREATE (d:Department {id: row.id, name: row.name, costCenter: row.costCenter})`,
      { rows: DEPARTMENTS },
    );

    // ----- Locations -----
    console.log(`[seed] Locations (${LOCATIONS.length})...`);
    await session.run(
      `UNWIND $rows AS row
       CREATE (l:Location {id: row.id, city: row.city, country: row.country, region: row.region})`,
      { rows: LOCATIONS },
    );

    // ----- Suppliers -----
    console.log(`[seed] Suppliers (${SUPPLIERS.length})...`);
    await session.run(
      `UNWIND $rows AS row
       CREATE (s:Supplier {id: row.id, name: row.name, rating: row.rating})`,
      { rows: SUPPLIERS },
    );

    // ----- Products -----
    console.log(`[seed] Products (${PRODUCTS.length})...`);
    await session.run(
      `UNWIND $rows AS row
       CREATE (p:Product {id: row.id, sku: row.sku, name: row.name, category: row.category})`,
      { rows: PRODUCTS },
    );

    // ----- Projects -----
    console.log(`[seed] Projects (${PROJECTS.length})...`);
    await session.run(
      `UNWIND $rows AS row
       CREATE (p:Project {id: row.id, name: row.name, status: row.status})`,
      { rows: PROJECTS },
    );

    // ----- People -----
    const people = generatePeople();
    console.log(`[seed] People (${people.length})...`);
    await session.run(
      `UNWIND $rows AS row
       CREATE (p:Person {
         id: row.id, name: row.name, email: row.email,
         title: row.title, joinedAt: row.joinedAt
       })`,
      {
        rows: people.map(({ roleId: _r, deptId: _d, reportsToId: _rep, ...rest }) => rest),
      },
    );

    // ----- Relationships: Person → Role, Dept -----
    console.log("[seed] Person HAS_ROLE + WORKS_IN ...");
    await session.run(
      `UNWIND $rows AS row
       MATCH (p:Person {id: row.id})
       MATCH (r:Role {id: row.roleId})
       MATCH (d:Department {id: row.deptId})
       MERGE (p)-[:HAS_ROLE]->(r)
       MERGE (p)-[:WORKS_IN]->(d)`,
      {
        rows: people.map((p) => ({ id: p.id, roleId: p.roleId, deptId: p.deptId })),
      },
    );

    // ----- Person REPORTS_TO -----
    console.log("[seed] Person REPORTS_TO ...");
    const reports = people.filter((p) => p.reportsToId !== null);
    await session.run(
      `UNWIND $rows AS row
       MATCH (sub:Person {id: row.id})
       MATCH (mgr:Person {id: row.reportsToId})
       MERGE (sub)-[:REPORTS_TO]->(mgr)`,
      {
        rows: reports.map((p) => ({ id: p.id, reportsToId: p.reportsToId })),
      },
    );

    // ----- Person MANAGES Project -----
    console.log("[seed] Person MANAGES Project ...");
    const projMgrs = generateProjectManagers(people);
    await session.run(
      `UNWIND $rows AS row
       MATCH (p:Person {id: row.personId})
       MATCH (proj:Project {id: row.projectId})
       MERGE (p)-[:MANAGES]->(proj)`,
      { rows: projMgrs },
    );

    // ----- Project USES Product -----
    console.log("[seed] Project USES Product ...");
    const projProds = generateProjectProducts();
    await session.run(
      `UNWIND $rows AS row
       MATCH (proj:Project {id: row.projectId})
       MATCH (p:Product {id: row.productId})
       MERGE (proj)-[:USES]->(p)`,
      { rows: projProds },
    );

    // ----- Product SUPPLIED_BY Supplier -----
    console.log("[seed] Product SUPPLIED_BY Supplier ...");
    const prodSups = generateProductSuppliers();
    await session.run(
      `UNWIND $rows AS row
       MATCH (p:Product {id: row.productId})
       MATCH (s:Supplier {id: row.supplierId})
       MERGE (p)-[:SUPPLIED_BY]->(s)`,
      { rows: prodSups },
    );

    // ----- Supplier LOCATED_IN Location -----
    console.log("[seed] Supplier LOCATED_IN Location ...");
    const supLocs = generateSupplierLocations();
    await session.run(
      `UNWIND $rows AS row
       MATCH (s:Supplier {id: row.supplierId})
       MATCH (l:Location {id: row.locationId})
       MERGE (s)-[:LOCATED_IN]->(l)`,
      { rows: supLocs },
    );

    // ----- Department LOCATED_IN Location -----
    console.log("[seed] Department LOCATED_IN Location ...");
    const deptLocs = generateDepartmentLocations();
    await session.run(
      `UNWIND $rows AS row
       MATCH (d:Department {id: row.deptId})
       MATCH (l:Location {id: row.locationId})
       MERGE (d)-[:LOCATED_IN]->(l)`,
      { rows: deptLocs },
    );

    // ----- Sanity counts -----
    const counts = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] AS label, count(n) AS total
      ORDER BY label
    `);
    console.log("[seed] Final node counts:");
    for (const rec of counts.records) {
      console.log(`  ${rec.get("label")}: ${rec.get("total")}`);
    }

    const relCounts = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) AS type, count(r) AS total
      ORDER BY type
    `);
    console.log("[seed] Relationship counts:");
    for (const rec of relCounts.records) {
      console.log(`  ${rec.get("type")}: ${rec.get("total")}`);
    }
  } finally {
    await session.close();
    await closeDriver();
  }

  console.log("[seed] Done.");
}

void main();

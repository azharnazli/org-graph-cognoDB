import { Router } from "express";
import { driver } from "../db/driver.js";

export const dashboardRouter = Router();

interface DashboardCounts {
  people: number;
  departments: number;
  projects: number;
  products: number;
  suppliers: number;
  locations: number;
  activeProjects: number;
  suppliersInRegion: Record<string, number>;
}

dashboardRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const session = driver.session({ database: "neo4j" });
    try {
      const counts = await session.run(`
        MATCH (p:Person) WITH count(p) AS people
        MATCH (d:Department) WITH people, count(d) AS departments
        MATCH (proj:Project) WITH people, departments, count(proj) AS projects
        MATCH (prod:Product) WITH people, departments, projects, count(prod) AS products
        MATCH (s:Supplier) WITH people, departments, projects, products, count(s) AS suppliers
        MATCH (l:Location) WITH people, departments, projects, products, suppliers, count(l) AS locations
        MATCH (ap:Project {status: "active"}) RETURN people, departments, projects, products, suppliers, locations, count(ap) AS activeProjects
      `);

      const regionCounts = await session.run(`
        MATCH (s:Supplier)-[:LOCATED_IN]->(l:Location)
        RETURN l.region AS region, count(s) AS total
        ORDER BY region
      `);
      const suppliersInRegion: Record<string, number> = {};
      for (const rec of regionCounts.records) {
        suppliersInRegion[String(rec.get("region"))] = Number(rec.get("total"));
      }

      const row = counts.records[0];
      if (!row) {
        res.status(503).json({ error: "NoData", message: "Empty graph" });
        return;
      }

      const body: DashboardCounts = {
        people: Number(row.get("people")),
        departments: Number(row.get("departments")),
        projects: Number(row.get("projects")),
        products: Number(row.get("products")),
        suppliers: Number(row.get("suppliers")),
        locations: Number(row.get("locations")),
        activeProjects: Number(row.get("activeProjects")),
        suppliersInRegion,
      };
      res.json({ data: body });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

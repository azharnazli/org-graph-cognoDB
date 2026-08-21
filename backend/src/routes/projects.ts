import { Router } from "express";
import type { Paginated, Project, ProjectDetail } from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";

export const projectsRouter = Router();

projectsRouter.get("/projects", async (req, res, next) => {
  try {
    const { skip, limit, page } = parsePagination(req.query["page"], req.query["pageSize"]);
    const { sortField, order } = parseSorting(
      "projects",
      req.query["sort"],
      req.query["order"],
      "name",
    );
    const status = String(req.query["status"] ?? "").trim();
    const where = status ? "WHERE p.status = $status" : "";

    const session = driver.session({ database: "neo4j" });
    try {
      const params: Record<string, unknown> = { skip, limit };
      if (status) params["status"] = status;

      const result = await session.run(
        `MATCH (p:Project)
         ${where}
         RETURN p { .id, .name, .status } AS p
         ORDER BY p.${sortField} ${order}
         SKIP $skip LIMIT $limit`,
        params,
      );
      const totalResult = await session.run(`MATCH (p:Project) ${where} RETURN count(p) AS total`, params);
      const total = totalResult.records[0]?.get("total") ?? 0;

      const data: Project[] = result.records.map((rec) => rec.get("p"));
      res.json({ data, page, pageSize: limit, total } satisfies Paginated<Project>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

projectsRouter.get("/projects/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }

    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (proj:Project {id: $id})
         OPTIONAL MATCH (mgr:Person)-[:MANAGES]->(proj)
         WITH proj, collect(DISTINCT mgr { .id, .name, .email, .title, joinedAt: toString(mgr.joinedAt) }) AS managers
         OPTIONAL MATCH (anyMgr:Person)-[:MANAGES]->(proj)
         OPTIONAL MATCH (anyMgr)-[:WORKS_IN]->(d:Department)
         WITH proj, managers, head(collect(DISTINCT d { .id, .name, .costCenter })) AS department
         OPTIONAL MATCH (proj)-[:USES]->(p:Product)
         WITH proj, managers, department, collect(DISTINCT p { .id, .sku, .name, .category }) AS products
         RETURN proj {
           .id, .name, .status,
           managers: managers,
           department: department,
           products: products
         } AS detail`,
        { id },
      );

      const detail = result.records[0]?.get("detail");
      if (!detail) {
        res.status(404).json({ error: "NotFound", message: "Project not found" });
        return;
      }
      res.json({ data: detail as ProjectDetail });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

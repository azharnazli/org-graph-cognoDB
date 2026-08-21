import { Router } from "express";
import type {
  Paginated,
  Project,
  ProjectDetail,
  CreateProjectInput,
  UpdateProjectInput,
  MutationResult,
} from "@org-graph/shared-types";
import { driver } from "../db/driver.js";
import { parsePagination, parseSorting } from "../lib/pagination.js";
import { validateCreateProject, validateUpdateProject } from "../lib/validate.js";

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

projectsRouter.post("/projects", async (req, res, next) => {
  try {
    const input = req.body as CreateProjectInput;
    const v = validateCreateProject(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const id = input.id?.trim() || `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const managerIds = input.managerIds ?? [];
      const result = await session.run(
        `CREATE (proj:Project {id: $id, name: $name, status: $status})
         WITH proj
         OPTIONAL MATCH (d:Department {id: $departmentId})
         FOREACH (_ IN CASE WHEN d IS NULL THEN [] ELSE [1] END | MERGE (d)-[:OWNS]->(proj))
         WITH proj
         OPTIONAL MATCH (mgr:Person) WHERE mgr.id IN $managerIds
         FOREACH (_ IN CASE WHEN mgr IS NULL THEN [] ELSE [1] END | MERGE (mgr)-[:MANAGES]->(proj))
         RETURN proj { .id, .name, .status } AS project`,
        {
          id,
          name: input.name,
          status: input.status,
          departmentId: input.departmentId ?? null,
          managerIds,
        },
      );
      const project = result.records[0]?.get("project") as Project | undefined;
      if (!project) {
        res.status(500).json({ error: "InternalServerError", message: "Create failed" });
        return;
      }
      res.status(201).json({ data: project } satisfies MutationResult<Project>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

projectsRouter.put("/projects/:id", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }
    const input = req.body as UpdateProjectInput;
    const v = validateUpdateProject(input);
    if (!v.ok) {
      res.status(400).json({ error: "ValidationError", message: "Invalid input", details: v.errors });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (proj:Project {id: $id})
         SET proj.name = coalesce($name, proj.name),
             proj.status = coalesce($status, proj.status)
         WITH proj
         OPTIONAL MATCH (mgr:Person) WHERE mgr.id IN $managerIds
         WITH proj, collect(DISTINCT mgr) AS mgrs
         OPTIONAL MATCH (proj)<-[oldR:MANAGES]-()
         DELETE oldR
         WITH proj, mgrs
         FOREACH (m IN mgrs | MERGE (m)-[:MANAGES]->(proj))
         RETURN proj { .id, .name, .status } AS project`,
        {
          id,
          name: input.name ?? null,
          status: input.status ?? null,
          managerIds: input.managerIds ?? [],
        },
      );
      const project = result.records[0]?.get("project") as Project | undefined;
      if (!project) {
        res.status(404).json({ error: "NotFound", message: "Project not found" });
        return;
      }
      res.json({ data: project } satisfies MutationResult<Project>);
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

projectsRouter.delete("/projects/:id", async (req, res, next) => {
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
         DETACH DELETE proj
         RETURN count(proj) AS deleted`,
        { id },
      );
      const deleted = (result.records[0]?.get("deleted")?.toNumber?.() ?? 0) > 0;
      if (!deleted) {
        res.status(404).json({ error: "NotFound", message: "Project not found" });
        return;
      }
      res.json({ data: { deleted: true } });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});

projectsRouter.get("/projects/:id/managers", async (req, res, next) => {
  try {
    const id = req.params["id"];
    if (!id) {
      res.status(400).json({ error: "BadRequest", message: "Missing id" });
      return;
    }
    const session = driver.session({ database: "neo4j" });
    try {
      const result = await session.run(
        `MATCH (mgr:Person)-[:MANAGES]->(proj:Project {id: $id})
         RETURN collect(DISTINCT mgr.id) AS managerIds`,
        { id },
      );
      const managerIds = (result.records[0]?.get("managerIds") ?? []) as string[];
      res.json({ data: managerIds });
    } finally {
      await session.close();
    }
  } catch (err) {
    next(err);
  }
});
